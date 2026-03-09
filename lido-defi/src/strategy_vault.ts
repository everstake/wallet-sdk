/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';
import {
  BigNumberish,
  JsonRpcProvider,
  parseEther,
  formatEther,
  AbiCoder,
} from 'ethers';
import {
  Lido,
  Lido__factory,
  StvPool,
  StvPool__factory,
} from './typechain-types';

import { Blockchain } from '../../utils';

import { NETWORK_ADDRESSES } from './constants';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import type { VaultType, EthTransaction, PendingDepositRequest } from './types';

export class StrategyVault extends Blockchain {
  public addressStrategy!: string;
  public contractStrategy!: StvPool;
  public contractLido!: Lido;

  private rpc!: JsonRpcProvider;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(network: VaultType = 'mainnet', url?: string) {
    super();
    this.initializeNetwork(network, url);
  }

  public selectNetwork(network: VaultType, url?: string) {
    this.initializeNetwork(network, url);
  }

  private initializeNetwork(network: VaultType, url?: string): void {
    const networkAddresses = NETWORK_ADDRESSES[network];

    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }
    const providerUrl = url ?? networkAddresses.rpcUrl;
    this.rpc = new JsonRpcProvider(providerUrl);
    this.addressStrategy = networkAddresses.addressStrategy;

    this.contractStrategy = StvPool__factory.connect(
      networkAddresses.addressStrategy,
      this.rpc,
    );
    this.contractLido = Lido__factory.connect(
      networkAddresses.addressLido,
      this.rpc,
    );
  }

  /**
   * Fetches the user's wstETH balance in the strategy pool
   *
   * @param address - The address to perform the check for.
   * @returns A Promise that resolves to the strategy pool balance in ether.
   */
  public async balance(address: string): Promise<BigNumber> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }
      const result = await this.contractStrategy.wstethOf(address);

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('BALANCE_ERROR', error);
    }
  }

  /**
   * Deposits ETH to the strategy pool
   *
   * @param address - User address
   * @param amount - Deposit amount in ETH
   * @param referral - Optional referral address
   * @param wstethToMint - Minimum wstETH to mint (0 for default)
   * @param isSync - Whether to use the sync deposit queue or async deposit queue // TODO: Mellow params?
   * @param merkleProof - Optional Merkle proof for allowlist-enabled queues // TODO: Mellow params?
   *
   * @returns unsigned ETH transaction object.
   */
  public async deposit(
    address: string,
    amount: BigNumberish,
    isSync: boolean = false,
    merkleProof: string[] = [],
    referral: string = '0x0000000000000000000000000000000000000000',
  ): Promise<EthTransaction> {
    if (!this.isAddress(address) || !this.isAddress(referral)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    const amountWei = parseEther(amount.toString());

    const params = AbiCoder.defaultAbiCoder().encode(
      ['bool', 'bytes32[]'],
      [isSync, merkleProof],
    );

    try {
      const supplyParamsTuple = {
        isSync: isSync,
        merkleProof: merkleProof,
      };

      const previewResult = await this.contractStrategy.previewSupply(
        amountWei,
        address,
        supplyParamsTuple,
      );

      if (!previewResult.success || previewResult.shares.toString() === '0') {
        throw new Error(
          'Supply simulation failed: previewSupply returned false or 0 shares',
        );
      }

      const expectedShares = previewResult.shares;

      const capacityShares =
        await this.contractStrategy.remainingMintingCapacitySharesOf(
          address,
          amountWei,
        );

      const maxMintShares =
        expectedShares < capacityShares ? expectedShares : capacityShares;

      const populatedTx =
        await this.contractStrategy.supply.populateTransaction(
          referral,
          maxMintShares,
          params,
        );

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: address,
        value: amountWei,
      });

      return {
        from: address,
        to: this.addressStrategy,
        value: amountWei,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError('DEPOSIT_ERROR', error);
    }
  }

  /**
   * Requests withdrawal from the strategy pool
   *
   * @param address - User address initiating the transaction
   * @param recipient - Recipient address of the withdrawal
   * @param stvToWithdraw - Amount of STV to withdraw
   * @param stethSharesToRebalance - Shares to rebalance in case of large strategy exits
   *
   * @returns unsigned ETH transaction object.
   */
  public async withdraw(
    address: string,
    recipient: string,
    stvToWithdraw: BigNumberish,
    stethSharesToRebalance: BigNumberish = '0',
  ): Promise<EthTransaction> {
    if (!this.isAddress(address) || !this.isAddress(recipient)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const populatedTx =
        await this.contractStrategy.requestWithdrawalFromPool.populateTransaction(
          recipient,
          stvToWithdraw.toString(),
          stethSharesToRebalance.toString(),
        );

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: address,
      });

      return {
        from: address,
        to: this.addressStrategy,
        value: 0n,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  /**
   * Fetches the user's pending deposit requests
   *
   * @param address - User address
   * @returns A Promise that resolves to the user's PendingDepositRequest
   */
  public async pendingDepositRequests(
    address: string,
  ): Promise<PendingDepositRequest> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }
      const result =
        await this.contractStrategy.pendingDepositRequests(address);

      return {
        assets: result.assets.toString(),
        timestamp: result.timestamp.toString(),
        isClaimable: Boolean(result.isClaimable),
      };
    } catch (error) {
      throw this.handleError('PENDING_DEPOSIT_REQUESTS_ERROR', error);
    }
  }

  private fromWeiToEther(amount: string | number | bigint): BigNumber {
    return new BigNumber(formatEther(amount));
  }

  private calculateGasLimit(gasConsumption: bigint): number {
    return new BigNumber(gasConsumption.toString())
      .plus(new BigNumber(220000)) // ETH_GAS_RESERVE fallback
      .toNumber();
  }

  private isAddress(address: string): boolean {
    return /^(0x)?([0-9a-f]{40})$/.test(address.toLowerCase());
  }
}
