/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import Web3, { Contract, HttpProvider, Numbers, Web3BaseProvider } from 'web3';
import { Blockchain } from '../../utils';

import { ABI_ERC20, ABI_ISSUANCE_VAULT, ABI_ORACLE, ABI_REDEMPTION_VAULT } from './abi';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import { NetworkType, MidasVaultAddresses, MidasVaultsMap, MidasVaultType, EthTransaction } from './types';
import { ETH_GAS_RESERVE, MIDAS_VAULTS_ADDRESSES, NETWORKS } from './constants';
import BigNumber from 'bignumber.js';

/**
 * The `Midas` class extends the `Blockchain` class and provides methods for interacting with the Midas vault contracts.
 *
 * @property {string} addressIssuanceVault - The address of the issuance vault contract.
 * @property {string} addressRedemptionVault - The address of the redemption vault contract.
 * @property {string} addressOracle - The address of the oracle contract.
 * @property {string} addressToken - The address of the collateral token contract.
 * @property {Contract} contractIssuanceVault - The issuance vault contract instance.
 * @property {Contract} contractRedemptionVault - The redemption vault contract instance.
 * @property {Contract} contractOracle - The oracle contract instance.
 * @property {Contract} contractToken - The token contract instance.
 * @property {string[]} supportedIssuanceTokensAddresses - Tokens supported by deposit.
 * @property {string[]} supportedRedemptionTokensAddresses - Tokens supported by redeem.
 * @property ERROR_MESSAGES - The error messages for the Midas class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Midas class.
 */
export class Midas extends Blockchain {
  public addressIssuanceVault!: string;
  public addressRedemptionVault!: string;
  public addressOracle!: string;
  public addressToken!: string;
  public contractIssuanceVault!: Contract<typeof ABI_ISSUANCE_VAULT>;
  public contractRedemptionVault!: Contract<typeof ABI_REDEMPTION_VAULT>;
  public contractOracle!: Contract<typeof ABI_ORACLE>;
  public contractToken!: Contract<typeof ABI_ERC20>;
  public supportedIssuanceTokensAddresses: string[] = [];
  public supportedRedemptionTokensAddresses: string[] = [];

  private web3!: Web3;
  private rpcUrl!: Web3BaseProvider;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  /**
   * Constructs a new Midas instance and initializes the network and contracts.
   *
   * @param network - The network type.
   * @param vault - The vault type.
   * @param url - Optional RPC URL for the network.
   */
  constructor(network: NetworkType, vault: MidasVaultType, url?: string) {
    super();
    this.initializeNetwork(network, vault, url);
  }

  /**
   * Initializes the network, contract addresses, and contract instances.
   *
   * @param network - The network type.
   * @param vaultType - The vault type.
   * @param url - Optional RPC URL for the network.
   * @throws Will throw an error if the network or vault is not supported.
   */
  private initializeNetwork(network: NetworkType, vaultType: MidasVaultType, url?: string) {
    const networkAddresses = NETWORKS[network];
    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }
    const midasAddresses = MIDAS_VAULTS_ADDRESSES[vaultType];
    if (!midasAddresses) {
      this.throwError('VAULT_NOT_SUPPORTED', vaultType);
    }
    if (midasAddresses.Network !== network) {
      this.throwError('INVALID_VAULT_NETWORK', `${vaultType} - ${network}`);
    }
    
    const providerUrl = url || networkAddresses.rpcUrl;
    this.rpcUrl = new HttpProvider(providerUrl);

    this.web3 = new Web3(this.rpcUrl);
    this.addressIssuanceVault = midasAddresses.issuanceVaultAddress;
    this.addressRedemptionVault = midasAddresses.redemptionVaultAddress;
    this.addressOracle = midasAddresses.oracleAddress;
    this.addressToken = midasAddresses.tokenAddress;

    
    this.contractIssuanceVault = new this.web3.eth.Contract(
      ABI_ISSUANCE_VAULT,
      this.addressIssuanceVault,
    );
    this.contractRedemptionVault = new this.web3.eth.Contract(
      ABI_REDEMPTION_VAULT,
      this.addressRedemptionVault,
    );
    this.contractOracle = new this.web3.eth.Contract(
      ABI_ORACLE,
      midasAddresses.oracleAddress,
    );
    this.contractToken = new this.web3.eth.Contract(
      ABI_ERC20,
      midasAddresses.tokenAddress,
    );

    try {
      this.contractIssuanceVault.methods.getPaymentTokens().call()
        .then((tokens: void | string[])  => {
          this.supportedIssuanceTokensAddresses = tokens ?? [];
        });
      this.contractRedemptionVault.methods.getRedemptionTokens().call()
        .then((tokens: void | string[])  => {
          this.supportedRedemptionTokensAddresses = tokens ?? [];
        });
    } catch (error) {
      this.throwError('GET_SUPPORTED_TOKENS_ERROR', (error as Error).message);
    }
  }


  /**
   * Retrieves the instant deposit fee from the issuance vault contract.
   * 
   * @returns A promise that resolves to the instant deposit fee as a number.
   * @throws Will throw an error if the contract call fails.
   */
  public async getInstantDepositFee(): Promise<number> {
    try {
      const fee = await this.contractIssuanceVault.methods.instantFee().call();
      // 1% = 100
      return Number(fee)/100;
    } catch (error) {
      throw this.handleError('GET_INSTANT_DEPOSIT_FEE_ERROR', error);
    }
  }


  /**
   * Retrieves the instant withdraw fee from the redemption vault contract.
   * 
   * @returns A promise that resolves to the instant withdraw fee as a number.
   * @throws Will throw an error if the contract call fails.
   */
  public async getInstantWithdrawFee(): Promise<number> {
    try {
      const fee = await this.contractRedemptionVault.methods.instantFee().call();
      // 1% = 100
      return Number(fee)/100;
    } catch (error) {
      throw this.handleError('GET_INSTANT_WITHDRAW_FEE_ERROR', error);
    }
  }


  /**
   * Retrieves the price from the oracle contract.
   * @returns A promise that resolves to the price as a BigNumber.
   * @throws Will throw an error if the contract call fails.
   */
  public async getPrice(): Promise<BigNumber> {
    try {
      const price = await this.contractOracle.methods.lastAnswer().call() as number;
      const decimals = await this.contractOracle.methods.decimals().call();
      return BigNumber(price).div(10 ** Number(decimals));
    } catch (error) {
      throw this.handleError('GET_PRICE_ERROR', error);
    }
  }


  /**
   * Retrieves the token balance of collateral for a given address.
   * @param address - The address to query the balance for.
   * @returns A promise that resolves to the balance as a BigNumber.
   * @throws Will throw an error if the contract call fails.
   */
  public async balanceOf(address: string): Promise<BigNumber> {
    try {
      const balance = await this.contractToken.methods.balanceOf(address).call() as number;
      const decimals = await this.contractToken.methods.decimals().call();
      return BigNumber(balance).div(10 ** Number(decimals));
    } catch (error) {
      throw this.handleError('GET_BALANCE_ERROR', error);
    }
  }


  /**
   * Deposits tokens instantly with auto mint if account fits daily limit and token allowance.
   * Transfers token from the user, fee in tokenIn to feeReceiver, and mints mToken to user.
   *
   * @param sender - The address of transaction sender.
   * @param tokenIn - The token address to deposit.
   * @param amount - The amount to deposit.
   * @param minReceiveAmount - The minimum amount to receive.
   * @param referrerId - The referrer ID as bytes32.
   * @returns A promise that resolves to an EthTransaction object.
   * @throws Will throw an error if the token is not supported or gas estimation fails.
   */
  public async depositInstant(sender: string, tokenIn: string, amount: Numbers, minReceiveAmount: Numbers, referrerId: string): Promise<EthTransaction> {
    if (!this.supportedIssuanceTokensAddresses.includes(tokenIn)) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenIn);
    }

    const tx = this.contractIssuanceVault.methods.depositInstant(
      tokenIn,
      this.web3.utils.toWei(amount.toString(), 'ether'),
      this.web3.utils.toWei(minReceiveAmount.toString(), 'ether'),
      referrerId,
    );

    try {
      const gasLimit = await tx.estimateGas({from: sender});

      return {
        from: sender,
        to: this.addressIssuanceVault,
        value: 0,
        gasLimit: this.calculateGasLimit(gasLimit),
        data: tx.encodeABI(),
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
    }
  }


  /**
   * Redeems mToken1 to tokenOut if daily limit and allowance not exceeded.
   * If contract doesn't have enough tokenOut, mToken1 will swap to mToken2 and redeem on mToken2 vault.
   * Burns mToken1 from the user, transfers fee in mToken1 to feeReceiver, and transfers tokenOut to user.
   *
   * @param sender - The address of transaction sender.
   * @param tokenOut - The token address to redeem to.
   * @param amount - The amount to redeem.
   * @param minReceiveAmount - The minimum amount to receive.
   * @returns A promise that resolves to an EthTransaction object.
   * @throws Will throw an error if the token is not supported or gas estimation fails.
   */
  public async redeemInstant(sender: string, tokenOut: string, amount: Numbers, minReceiveAmount: Numbers): Promise<EthTransaction> {
    if (!this.supportedRedemptionTokensAddresses.includes(tokenOut)) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenOut);
    }

    const tx = this.contractRedemptionVault.methods.redeemInstant(
      tokenOut,
      this.web3.utils.toWei(amount.toString(), 'ether'),
      this.web3.utils.toWei(minReceiveAmount.toString(), 'ether'),
    );

    try {
      const gasLimit = await tx.estimateGas({from: sender});

      return {
        from: sender,
        to: this.addressRedemptionVault,
        value: 0,
        gasLimit: this.calculateGasLimit(gasLimit),
        data: tx.encodeABI(),
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
    }
  }


  /**
   * Creates a redeem request if tokenOut is not fiat.
   * Transfers amount in mToken to contract and fee in mToken to feeReceiver.
   *
   * @param sender - The address of transaction sender.
   * @param tokenOut - The token address to redeem to.
   * @param amount - The amount to redeem.
   * @returns A promise that resolves to an EthTransaction object.
   * @throws Will throw an error if the token is not supported or gas estimation fails.
   */
  public async redeemRequest(sender: string, tokenOut: string, amount: Numbers): Promise<EthTransaction> {
    if (!this.supportedRedemptionTokensAddresses.includes(tokenOut)) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenOut);
    }

    const tx = this.contractRedemptionVault.methods.redeemRequest(
      tokenOut,
      this.web3.utils.toWei(amount.toString(), 'ether'),
    );

    try {
      const gasLimit = await tx.estimateGas({from: sender});

      return {
        from: sender,
        to: this.addressRedemptionVault,
        value: 0,
        gasLimit: this.calculateGasLimit(gasLimit),
        data: tx.encodeABI(),
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
    }
  }

  /**
   * Calculates the gas limit by adding a predefined GAS_RESERVE to the given gas consumption.
   *
   * @param gasConsumption - The amount of gas consumed.
   * @returns The calculated gas limit as a number.
   */
  private calculateGasLimit(gasConsumption: bigint): number {
    return new BigNumber(gasConsumption.toString())
      .plus(ETH_GAS_RESERVE)
      .toNumber();
  }
}