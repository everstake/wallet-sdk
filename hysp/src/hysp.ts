/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { Blockchain } from '../../utils';

import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import { EthTransaction, NetworkType } from './types';
import { NETWORKS } from './constants';
import BigNumber from 'bignumber.js';
import { containsCaseInsensitive } from './utils';
import { JsonRpcProvider } from 'ethers';
import {
  Erc20,
  Erc20__factory,
  IssuanceVault,
  IssuanceVault__factory,
  Oracle,
  Oracle__factory,
  RedemptionVault,
  RedemptionVault__factory,
} from './typechain-types';
import { BigNumberish, ContractTransaction } from 'ethers';

/**
 * The `Hysp` class extends the `Blockchain` class and provides methods for interacting with the Hysp vault contracts.
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
 * @property ERROR_MESSAGES - The error messages for the Hysp class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Hysp class.
 */
export class Hysp extends Blockchain {
  public addressIssuanceVault!: string;
  public addressRedemptionVault!: string;
  public addressOracle!: string;
  public addressToken!: string;
  public supportedIssuanceTokensAddresses: string[] = [];
  public supportedRedemptionTokensAddresses: string[] = [];

  public contractIssuanceVault!: IssuanceVault;
  public contractRedemptionVault!: RedemptionVault;
  public contractOracle!: Oracle;
  public contractToken!: Erc20;

  private tokenDecimalsStore: { [address: string]: number };
  private provider!: JsonRpcProvider;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  /**
   * Constructs a new Hysp instance and initializes the network and contracts.
   *
   * @param network - The network type.
   * @param vault - The vault type.
   * @param url - Optional RPC URL for the network.
   */
  constructor() {
    super();
    this.tokenDecimalsStore = {};
  }

  /**
   * Initializes the network, contract addresses, and contract instances.
   *
   * @param url - Optional RPC URL for the network.
   * @throws Will throw an error if fails to fetch data from smart contracts or if invalid network is passed.
   */
  public async init(network: NetworkType = 'eth_mainnet', url?: string) {
    const hyspAddresses = NETWORKS[network];
    if (!hyspAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }

    const providerUrl = url || hyspAddresses.rpcUrl;

    this.provider = new JsonRpcProvider(providerUrl);
    this.addressIssuanceVault = hyspAddresses.issuanceVaultAddress;
    this.addressRedemptionVault = hyspAddresses.redemptionVaultAddress;
    this.addressOracle = hyspAddresses.oracleAddress;
    this.addressToken = hyspAddresses.tokenAddress;

    this.contractIssuanceVault = IssuanceVault__factory.connect(
      this.addressIssuanceVault,
      this.provider,
    );
    this.contractRedemptionVault = RedemptionVault__factory.connect(
      this.addressRedemptionVault,
      this.provider,
    );
    this.contractOracle = Oracle__factory.connect(
      this.addressOracle,
      this.provider,
    );
    this.contractToken = Erc20__factory.connect(
      this.addressToken,
      this.provider,
    );

    try {
      this.supportedIssuanceTokensAddresses =
        await this.contractIssuanceVault.getPaymentTokens();
      this.supportedRedemptionTokensAddresses =
        await this.contractRedemptionVault.getPaymentTokens();
    } catch (error) {
      this.throwError('GET_SUPPORTED_TOKENS_ERROR', (error as Error).message);
    }
  }

  /**
   * Retrieves the liquidity available for instant redemption in the redemption vault contract.
   *
   * @param outTokenAddress - Optional address of the output token to check liquidity for.
   * If not provided, defaults to the first supported redemption token.
   *
   * @returns A promise that resolves to the liquidity amount as a number.
   * @throws Will throw an error if the token is not supported or if the contract call fails.
   */
  public async getInstantRedeemLiquidityAmount(
    outTokenAddress?: string,
  ): Promise<BigNumber> {
    try {
      if (
        outTokenAddress &&
        !containsCaseInsensitive(
          this.supportedRedemptionTokensAddresses,
          outTokenAddress,
        )
      ) {
        throw this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', outTokenAddress);
      }
      if (!outTokenAddress) {
        outTokenAddress = this.supportedRedemptionTokensAddresses[0];
      }
      if (!outTokenAddress) {
        throw this.throwError(
          'VAULT_LIQUIDITY_ERROR',
          'token address is undefined',
        );
      }

      const liquidityProviderAddress =
        await this.contractRedemptionVault.liquidityProvider();
      const contractOutErc20 = Erc20__factory.connect(
        outTokenAddress,
        this.provider,
      );
      const liquidity = await contractOutErc20.balanceOf(
        liquidityProviderAddress,
      );
      const decimals = await this.getDecimals(outTokenAddress);

      return this.fromWeiToEther(liquidity, decimals.toString());
    } catch (error) {
      throw this.handleError('VAULT_LIQUIDITY_ERROR', error);
    }
  }

  /**
   * Retrieves the minimum deposit amount from the redemption vault contract.
   *
   * @param outTokenAddress - Optional address of the output token to adjust decimals.
   * If not provided, defaults to 18 decimals.
   *
   * @returns A promise that resolves to the minimum deposit amount as a number.
   * @throws Will throw an error if the contract call fails.
   */
  public async minRedeemAmount(outTokenAddress?: string): Promise<BigNumber> {
    try {
      const minAmount = await this.contractRedemptionVault.minAmount();
      const decimals = await this.getDecimals(outTokenAddress);

      return this.fromWeiToEther(minAmount, decimals.toString());
    } catch (error) {
      throw this.handleError('GET_MIN_REDEEM_AMOUNT_ERROR', error);
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
      const fee = await this.contractIssuanceVault.instantFee();

      // 1% = 100
      return Number(fee) / 100;
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
  public async getInstantRedeemFee(): Promise<number> {
    try {
      const fee = await this.contractRedemptionVault.instantFee();

      // 1% = 100
      return Number(fee) / 100;
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
      const price = await this.contractOracle.lastAnswer();
      const decimals = await this.getDecimals(this.addressOracle);

      return this.fromWeiToEther(price, decimals);
    } catch (error) {
      throw this.handleError('GET_PRICE_ERROR', error);
    }
  }

  /**
   * Retrieves the balance of ERC20 token. If erc20contractAddress is not provided,
   * it retrieves the balance of the collateral token.
   *
   * @param address - The address to check the balance for.
   * @param erc20contractAddress - Optional address of the ERC20 token contract.
   * If not provided, defaults to the collateral token. Only relevant tokens are
   * supported: redemption and issuance tokens.
   *
   * @returns A promise that resolves to the balance as a BigNumber.
   * @throws Will throw an error if the token is not supported or if the contract call fails.
   */
  public async balanceOf(
    address: string,
    erc20contractAddress?: string,
  ): Promise<BigNumber> {
    let erc20contract, contractAddress;
    if (erc20contractAddress) {
      if (
        erc20contractAddress != this.addressToken &&
        !containsCaseInsensitive(
          this.supportedIssuanceTokensAddresses,
          erc20contractAddress,
        ) &&
        !containsCaseInsensitive(
          this.supportedRedemptionTokensAddresses,
          erc20contractAddress,
        )
      ) {
        throw this.throwError(
          'TOKEN_NOT_SUPPORTED_BY_VAULT',
          erc20contractAddress,
        );
      }

      contractAddress = erc20contractAddress;
      erc20contract = Erc20__factory.connect(
        erc20contractAddress,
        this.provider,
      );
    } else {
      contractAddress = this.addressToken;
      erc20contract = this.contractToken;
    }

    try {
      const balance = await erc20contract.balanceOf(address);
      const decimals = await this.getDecimals(contractAddress);

      return this.fromWeiToEther(balance, decimals);
    } catch (error) {
      throw this.handleError('GET_BALANCE_ERROR', error);
    }
  }

  /**
   * Approves the redemption vault to spend a specified amount of the collateral token on behalf of the sender.
   *
   * @param sender - The address of the transaction sender.
   * @param amount - The amount of tokens to approve.
   * @returns A promise that resolves to an EthTransaction object.
   * @throws Will throw an error if gas estimation fails.
   */
  public async approveToRedemptionVault(
    sender: string,
    amount: BigNumberish,
  ): Promise<EthTransaction> {
    let tx;
    try {
      tx = await this.contractToken.approve.populateTransaction(
        this.addressRedemptionVault,
        ethers.parseUnits(
          amount.toString(),
          await this.getDecimals(this.addressToken),
        ),
      );
    } catch (error) {
      throw this.handleError('FAILED_TO_BUILD_TRANSACTION', error);
    }

    try {
      const gasLimit = await this.calculateGasLimit(sender, tx);

      return {
        from: sender,
        to: this.addressToken,
        value: 0,
        gasLimit: gasLimit,
        data: tx.data,
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
    }
  }

  /**
   * Approves the issuance vault to spend a specified amount of a given token on behalf of the sender.
   *
   * @param sender - The address of the transaction sender.
   * @param tokenAddress - The address of the ERC20 token to approve.
   * Must be one of tokens supported by the issuance vault.
   * @param amount - The amount of tokens to approve.
   * @returns A promise that resolves to an EthTransaction object.
   * @throws Will throw an error if the token is not supported or gas estimation fails.
   */
  public async approveToIssuanceVault(
    sender: string,
    tokenAddress: string,
    amount: BigNumberish,
  ): Promise<EthTransaction> {
    if (
      !containsCaseInsensitive(
        this.supportedIssuanceTokensAddresses,
        tokenAddress,
      )
    ) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenAddress);
    }

    const contract = Erc20__factory.connect(tokenAddress, this.provider);
    let tx;
    try {
      tx = await contract.approve.populateTransaction(
        this.addressIssuanceVault,
        ethers.parseUnits(
          amount.toString(),
          await this.getDecimals(tokenAddress),
        ),
      );
    } catch (error) {
      throw this.handleError('FAILED_TO_BUILD_TRANSACTION', error);
    }

    try {
      const gasLimit = await this.calculateGasLimit(sender, tx);

      return {
        from: sender,
        to: tokenAddress,
        value: 0,
        gasLimit: gasLimit,
        data: tx.data,
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
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
  public async depositInstant(
    sender: string,
    tokenIn: string,
    amount: BigNumberish,
    minReceiveAmount: BigNumberish,
    referrerId: string,
  ): Promise<EthTransaction> {
    if (
      !containsCaseInsensitive(this.supportedIssuanceTokensAddresses, tokenIn)
    ) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenIn);
    }

    let tx;
    try {
      tx = await this.contractIssuanceVault.depositInstant.populateTransaction(
        tokenIn,
        ethers.parseUnits(amount.toString(), `ether`),
        ethers.parseUnits(
          minReceiveAmount.toString(),
          await this.getDecimals(this.addressToken),
        ),
        referrerId,
      );
    } catch (error) {
      throw this.handleError('FAILED_TO_BUILD_TRANSACTION', error);
    }

    try {
      const gasLimit = await this.calculateGasLimit(sender, tx);

      return {
        from: sender,
        to: this.addressIssuanceVault,
        value: 0,
        gasLimit: gasLimit,
        data: tx.data,
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
  public async redeemInstant(
    sender: string,
    tokenOut: string,
    amount: BigNumberish,
    minReceiveAmount: BigNumberish,
  ): Promise<EthTransaction> {
    if (
      !containsCaseInsensitive(
        this.supportedRedemptionTokensAddresses,
        tokenOut,
      )
    ) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenOut);
    }

    let tx;
    try {
      tx = await this.contractRedemptionVault.redeemInstant.populateTransaction(
        tokenOut,
        ethers.parseUnits(amount.toString(), `ether`),
        ethers.parseUnits(
          minReceiveAmount.toString(),
          await this.getDecimals(tokenOut),
        ),
      );
    } catch (error) {
      throw this.handleError('FAILED_TO_BUILD_TRANSACTION', error);
    }

    try {
      const gasLimit = await this.calculateGasLimit(sender, tx);

      return {
        from: sender,
        to: this.addressRedemptionVault,
        value: 0,
        gasLimit: gasLimit,
        data: tx.data,
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
  public async redeemRequest(
    sender: string,
    tokenOut: string,
    amount: BigNumberish,
  ): Promise<EthTransaction> {
    if (
      !containsCaseInsensitive(
        this.supportedRedemptionTokensAddresses,
        tokenOut,
      )
    ) {
      this.throwError('TOKEN_NOT_SUPPORTED_BY_VAULT', tokenOut);
    }

    let tx;
    try {
      tx = await this.contractRedemptionVault.redeemRequest.populateTransaction(
        tokenOut,
        ethers.parseUnits(
          amount.toString(),
          await this.getDecimals(this.addressToken),
        ),
      );
    } catch (error) {
      throw this.handleError('FAILED_TO_BUILD_TRANSACTION', error);
    }

    try {
      const gasLimit = await this.calculateGasLimit(sender, tx);

      return {
        from: sender,
        to: this.addressRedemptionVault,
        value: 0,
        gasLimit: gasLimit,
        data: tx.data,
      };
    } catch (error) {
      throw this.handleError('GAS_ESTIMATE_FAILED', error);
    }
  }

  /**
   * Retrieves the number of decimals for a given ERC20 token.
   *
   * @param tokenAddress - The address of the ERC20 token.
   * @returns A promise that resolves to the number of decimals.
   */
  private async getDecimals(tokenAddress?: string): Promise<number> {
    if (!tokenAddress) {
      return 18;
    }
    if (this.tokenDecimalsStore[tokenAddress]) {
      return this.tokenDecimalsStore[tokenAddress];
    }
    const contract = Erc20__factory.connect(tokenAddress, this.provider);
    const decimals = await contract.decimals();
    this.tokenDecimalsStore[tokenAddress] = Number(decimals);

    return Number(decimals);
  }

  /**
   * Calculates the gas limit by adding a predefined GAS_RESERVE to the given gas consumption.
   *
   * @param gasConsumption - The amount of gas consumed.
   * @returns The calculated gas limit as a number.
   */
  private async calculateGasLimit(
    sender: string,
    tx: ContractTransaction,
  ): Promise<number> {
    const gas = await this.provider.estimateGas({
      ...tx,
      from: sender,
    });

    return new BigNumber(gas.toString()).toNumber();
  }

  /**
   * Converts an amount from Wei to Ether based on the given decimals.
   *
   * @param amount - The amount without decimals.
   * @param decimals - The number of decimals for the token.
   * @returns The amount converted to Ether as a BigNumber.
   */
  private fromWeiToEther(
    amount: BigNumberish,
    decimals: BigNumberish,
  ): BigNumber {
    const offset = new BigNumber(10).pow(decimals.toString());

    return new BigNumber(amount.toString()).div(offset);
  }

  private fromEtherToWei(amount: BigNumberish, decimals: BigNumberish): number {
    const offset = new BigNumber(10).pow(decimals.toString());

    return new BigNumber(amount.toString()).multipliedBy(offset).toNumber();
  }
}
