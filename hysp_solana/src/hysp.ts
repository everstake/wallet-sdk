/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  createSolanaRpc,
  Address,
  createNoopSigner,
  address,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  prependTransactionMessageInstruction,
  compressTransactionMessageUsingAddressLookupTables,
  fetchAddressesForLookupTables,
  TransactionMessage,
  TransactionMessageWithLifetime,
  Rpc,
  SolanaRpcApi,
  Instruction,
  compileTransaction,
  getTransactionEncoder,
} from '@solana/kit';

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

import { getAddMemoInstruction } from '@solana-program/memo';

import { KaminoVault, VaultHoldings, APY } from '@kamino-finance/klend-sdk';

import { Decimal } from 'decimal.js';
import { Blockchain } from '../../utils';
import { ERROR_MESSAGES } from './constants/errors';
import { MAX_TRANSACTION_SIZE } from './constants';
import { VAULTS, SupportedToken, VaultInfo } from './constants';
import { ApiResponse, Params, VaultMeta } from './types';

/**
 * The `HyspSolana` class extends the `Blockchain` class and provides methods for interacting with vaults on Solana.
 *
 * This SDK allows users to perform vault operations such as deposits, withdrawals, and retrieving vault information.
 *
 * @property connection - The connection to the Solana blockchain.
 * @property vault - The KaminoVault instance for vault operations.
 * @property tokenSymbol - The supported token symbol for the vault.
 * @property ERROR_MESSAGES - The error messages for the HYSP class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the HYSP class.
 *
 */
export class HyspSolana extends Blockchain {
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ERROR_MESSAGES;

  private connection: Rpc<SolanaRpcApi>;
  private vault: KaminoVault;
  private vaultInfo: VaultInfo;
  private tokenSymbol: SupportedToken;

  /**
   * Creates a new instance of the KaminoSDK.
   *
   * @param rpcUrl - Optional custom RPC URL. If not provided, uses the default Solana mainnet RPC.
   *
   * @throws Throws an error if the token symbol is not supported.
   * @throws Throws an error if there's an issue during SDK initialization.
   */
  constructor(tokenSymbol: SupportedToken, rpcUrl?: string) {
    super();

    this.tokenSymbol = tokenSymbol;
    this.vaultInfo = this.getVaultInfo(tokenSymbol);

    try {
      const connectionUrl = rpcUrl || 'https://api.mainnet-beta.solana.com';
      this.connection = createSolanaRpc(connectionUrl);
      this.vault = new KaminoVault(this.connection, this.vaultInfo.address);
    } catch (error) {
      throw this.handleError('INITIALIZATION_ERROR', error);
    }
  }

  private getVaultInfo(tokenSymbol: SupportedToken): VaultInfo {
    const vaultInfo = VAULTS[tokenSymbol];
    if (!vaultInfo) {
      throw this.throwError('VAULT_NOT_FOUND_ERROR', tokenSymbol);
    }

    return vaultInfo;
  }

  /**
   * Retrieves the vault metadata including network, vault key, share token info, and contract addresses.
   *
   * @returns A promise that resolves with the vault metadata wrapped in ApiResponse.
   */
  getVaultMeta(): ApiResponse<VaultMeta> {
    return {
      result: {
        network: 'solana_mainnet',
        vaultKey: this.tokenSymbol,
        shareToken: {
          address: this.vaultInfo.shareTokenAddress.toString(),
          symbol: this.vaultInfo.shareTokenSymbol,
          decimals: this.vaultInfo.shareTokenDecimals,
        },
        contracts: {
          vault: this.vaultInfo.address.toString(),
        },
      },
    };
  }

  private convertToDecimal(amount: number | string | bigint): Decimal {
    return new Decimal(amount.toString());
  }

  /**
   * Fetches the vault holdings data.
   *
   * @throws Throws an error if there's an issue loading vault holdings.
   *
   * @returns Returns a promise that resolves with the vault holdings.
   */
  async getVaultHoldings(): Promise<ApiResponse<VaultHoldings>> {
    try {
      const holdings = await this.vault.getVaultHoldings();

      return { result: holdings };
    } catch (error) {
      throw this.handleError('VAULT_LOAD_ERROR', error);
    }
  }

  /**
   * Fetches the vault APY data.
   *
   * @throws Throws an error if there's an issue loading vault APYs.
   *
   * @returns Returns a promise that resolves with the vault actual APY information.
   */
  async getVaultAPYs(): Promise<ApiResponse<APY>> {
    try {
      const apys = await this.vault.getAPYs();

      return { result: apys.actualAPY };
    } catch (error) {
      throw this.handleError('VAULT_LOAD_ERROR', error);
    }
  }

  /**
   * Fetches the current vault exchange rate (tokens per share).
   *
   * @throws Throws an error if there's an issue loading exchange rate.
   *
   * @returns Returns a promise that resolves with the exchange rate as Decimal.
   */
  async getExchangeRate(): Promise<ApiResponse<Decimal>> {
    try {
      const rate = await this.vault.getExchangeRate();

      return { result: rate };
    } catch (error) {
      throw this.handleError('VAULT_LOAD_ERROR', error);
    }
  }

  /**
   * Fetches a user's raw share balance in the current vault.
   *
   * @param userAddress - The public key of the user account.
   * @throws Throws an error if there's an issue fetching user shares.
   * @returns Returns a promise that resolves with the user's shares amount.
   */
  async getUserShares(userAddress: Address): Promise<ApiResponse<Decimal>> {
    try {
      const shares = await this.vault.getUserShares(userAddress);

      return {
        result: shares.totalShares,
      };
    } catch (error) {
      throw this.handleError('GET_SHARES_ERROR', error);
    }
  }

  /**
   * Fetches a user's token balance in the current vault: shares * exchange rate.
   *
   * @param userAddress - The public key of the user account.
   * @throws Throws an error if there's an issue fetching user balance.
   * @returns Returns a promise that resolves with the user's token balance amount.
   */
  async getUserBalance(userAddress: Address): Promise<ApiResponse<Decimal>> {
    try {
      const balance = await this.vault.getUserShares(userAddress);
      const exchangeRate = await this.vault.getExchangeRate();
      const tokenBalance = balance.totalShares.mul(exchangeRate);

      return {
        result: tokenBalance,
      };
    } catch (error) {
      throw this.handleError('GET_BALANCE_ERROR', error);
    }
  }
  /**
   * Fetches the maximum available liquidity amount in the vaults allocations' reserves.
   *
   * @throws Throws an error if there's an issue loading vault's state or reserves.
   *
   * @returns Returns a promise that resolves with the maximum available liquidity amount as Decimal.
   */
  async getVaultLiquidityAmount(): Promise<ApiResponse<Decimal>> {
    try {
      const state = await this.vault.getState();
      const reserves = await this.vault.client.loadVaultReserves(state);

      const mintFactor = new Decimal(10).pow(
        new Decimal(state.tokenMintDecimals.toString()),
      );
      let totalLiquiditty = new Decimal(state.tokenAvailable.toString());
      for (const [, reserve] of reserves) {
        const reserveLiquidity = reserve.getLiquidityAvailableAmount();
        totalLiquiditty = totalLiquiditty.add(reserveLiquidity);
      }

      return {
        result: totalLiquiditty.div(mintFactor),
      };
    } catch (error) {
      throw this.handleError('VAULT_LOAD_ERROR', error);
    }
  }

  /**
   * Creates a deposit transaction to the vault.
   *
   * @param userAddress - The public key of the user account.
   * @param amount - The amount to deposit.
   * @param params - Optional transaction parameters.
   *
   * @throws Throws an error if there's an issue creating the deposit transaction.
   *
   * @returns Returns a promise that resolves with the deposit transaction response.
   */
  async deposit(
    userAddress: Address,
    amount: number | string | bigint | Decimal,
    params?: Params,
  ): Promise<ApiResponse<TransactionMessageWithLifetime>> {
    try {
      const signer = createNoopSigner(userAddress);
      let decimalAmount: Decimal;
      if (amount instanceof Decimal) {
        decimalAmount = amount;
      } else {
        decimalAmount = this.convertToDecimal(amount);
      }

      const vaultState = await this.vault.getState();
      const depositIxs = await this.vault.depositIxs(signer, decimalAmount);

      const mergedDepositIxs: Instruction[] = [];

      depositIxs.depositIxs.forEach((instruction) => {
        mergedDepositIxs.push(instruction);
      });
      depositIxs.stakeInFarmIfNeededIxs.forEach((instruction) => {
        mergedDepositIxs.push(instruction);
      });

      const transactionMessage = await this.buildTx(
        userAddress.toString(),
        mergedDepositIxs,
        params,
        [vaultState.vaultLookupTable],
      );

      return {
        result: transactionMessage,
      };
    } catch (error) {
      throw this.handleError('DEPOSIT_ERROR', error);
    }
  }

  /**
   * Creates a withdraw transaction from the vault.
   *
   * @param userAddress - The public key of the user account.
   * @param sharesAmount - The amount of shares to withdraw.
   * @param params - Optional transaction parameters.
   *
   * @throws Throws an error if there's issue creating the withdraw transaction.
   *
   * @returns Returns a promise that resolves with the withdraw transaction response.
   */
  async withdraw(
    userAddress: Address,
    sharesAmount: number | string | bigint | Decimal,
    params?: Params,
  ): Promise<ApiResponse<TransactionMessageWithLifetime>> {
    try {
      const signer = createNoopSigner(userAddress);
      let sharesDecimal: Decimal;
      if (sharesAmount instanceof Decimal) {
        sharesDecimal = sharesAmount;
      } else {
        sharesDecimal = this.convertToDecimal(sharesAmount);
      }

      const vaultState = await this.vault.getState();
      const withdrawIxs = await this.vault.withdrawIxs(signer, sharesDecimal);

      const mergedWithdrawIxs: Instruction[] = [];

      withdrawIxs.unstakeFromFarmIfNeededIxs.forEach((instruction) => {
        mergedWithdrawIxs.push(instruction);
      });
      withdrawIxs.withdrawIxs.forEach((instruction) => {
        mergedWithdrawIxs.push(instruction);
      });
      withdrawIxs.postWithdrawIxs.forEach((instruction) => {
        mergedWithdrawIxs.push(instruction);
      });

      const transactionMessage = await this.buildTx(
        userAddress.toString(),
        mergedWithdrawIxs,
        params,
        [vaultState.vaultLookupTable],
      );

      return {
        result: transactionMessage,
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  /**
   * Processes and creates a memo instruction according to SDK requirements
   * @param memo - Input memo text
   * @returns Memo instruction
   */
  protected processMemo(memo?: string): Instruction {
    // Process memo text
    let processedMemo: string;
    if (!memo || memo.trim() === '') {
      processedMemo = 'SDK';
    } else {
      const trimmedMemo = memo.trim();
      if (trimmedMemo === 'SDK') {
        processedMemo = trimmedMemo;
      } else if (!trimmedMemo.startsWith('SDK:')) {
        processedMemo = `SDK:${trimmedMemo}`;
      } else {
        processedMemo = trimmedMemo;
      }
    }

    // Validate memo
    if (processedMemo.length > 64) {
      throw new Error(
        `Invalid memo: "${processedMemo}". Must be max 64 characters`,
      );
    }

    const validPattern = /^[A-Za-z0-9:_-]*$/;
    if (!validPattern.test(processedMemo)) {
      throw new Error(
        `Invalid memo: "${processedMemo}". Must contain only [A-Za-z0-9:_-] characters`,
      );
    }

    return getAddMemoInstruction({ memo: processedMemo });
  }

  private async buildTx(
    sender: string,
    instructions: Instruction[],
    params?: Params,
    lookupTableAddresses?: Address[],
  ): Promise<TransactionMessageWithLifetime> {
    let transactionMessage: TransactionMessage = createTransactionMessage({
      version: 0,
    });

    if (
      params?.computeUnitLimit !== undefined &&
      params?.computeUnitLimit > 0
    ) {
      const unitLimitInstruction = getSetComputeUnitLimitInstruction({
        /** Transaction compute unit limit used for prioritization fees. */
        units: params?.computeUnitLimit,
      });

      transactionMessage = prependTransactionMessageInstruction(
        unitLimitInstruction,
        transactionMessage,
      );
    }

    if (
      params?.сomputeUnitPrice !== undefined &&
      params?.сomputeUnitPrice > 0
    ) {
      const unitPriceInstruction = getSetComputeUnitPriceInstruction({
        /** Transaction compute unit price used for prioritization fees. */
        microLamports: params?.сomputeUnitPrice,
      });
      transactionMessage = prependTransactionMessageInstruction(
        unitPriceInstruction,
        transactionMessage,
      );
    }

    for (const instruction of instructions) {
      transactionMessage = appendTransactionMessageInstruction(
        instruction,
        transactionMessage,
      );
    }

    // Add memo instruction if memo is provided in params
    if (params?.memo !== undefined) {
      const memoInstruction = this.processMemo(params.memo);
      transactionMessage = appendTransactionMessageInstruction(
        memoInstruction,
        transactionMessage,
      );
    }

    if (params?.afterInstructions) {
      for (const instruction of params.afterInstructions) {
        transactionMessage = appendTransactionMessageInstruction(
          instruction,
          transactionMessage,
        );
      }
    }

    if (lookupTableAddresses && lookupTableAddresses.length > 0) {
      const fetchedTables = await fetchAddressesForLookupTables(
        lookupTableAddresses,
        this.connection,
      );
      transactionMessage = compressTransactionMessageUsingAddressLookupTables(
        transactionMessage,
        fetchedTables,
      );
    }

    const txWithFeePayer = setTransactionMessageFeePayer(
      address(sender),
      transactionMessage,
    );

    const finalLatestBlockhash =
      params?.finalLatestBlockhash ||
      (await this.connection.getLatestBlockhash().send()).value;

    const txMessageWithBlockhashLifetime =
      setTransactionMessageLifetimeUsingBlockhash(
        finalLatestBlockhash,
        txWithFeePayer,
      );

    const compiledTx = compileTransaction(txMessageWithBlockhashLifetime);
    const serializedTx = getTransactionEncoder().encode(compiledTx);
    const txSize = serializedTx.length;

    if (txSize > MAX_TRANSACTION_SIZE) {
      throw this.throwError('TX_TOO_LARGE');
    }

    return txMessageWithBlockhashLifetime;
  }
}
