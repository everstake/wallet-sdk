/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  createSolanaRpc,
  Address,
  createNoopSigner,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  TransactionMessage,
} from '@solana/kit';

import {
  KaminoVault,
  VaultHoldings,
  VaultAPYs,
  APY,
} from '@kamino-finance/klend-sdk';

import { Decimal } from 'decimal.js';
import { Blockchain } from '../../utils';
import { ERROR_MESSAGES } from './constants/errors';
import {
  VAULTS,
  SupportedToken,
} from './constants';
import {
  ApiResponse,
  Params
} from './types';

/**
 * The `HyspSolana` class extends the `Blockchain` class and provides methods for interacting with Kamino vaults on Solana.
 * 
 * This SDK allows users to perform vault operations such as deposits, withdrawals, and retrieving vault information.
 *
 * @property connection - The connection to the Solana blockchain.
 * @property vault - The KaminoVault instance for vault operations.
 * @property tokenSymbol - The supported token symbol for the vault.
 * @property ERROR_MESSAGES - The error messages for the Kamino class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Kamino class.
 *
 */
export class HyspSolana extends Blockchain {
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ERROR_MESSAGES;
  
  private connection: any;
  private vault: KaminoVault;

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
    
    const vaultAddress = this.getVaultAddress(tokenSymbol);
    
    try {
      const connectionUrl = rpcUrl || 'https://api.mainnet-beta.solana.com';
      this.connection = createSolanaRpc(connectionUrl);
      this.vault = new KaminoVault(this.connection, vaultAddress);
    } catch (error) {
      throw this.handleError('INITIALIZATION_ERROR', error);
    }
  }

  private getVaultAddress(tokenSymbol: SupportedToken) {
    const vaultAddress = VAULTS[tokenSymbol];
    if (!vaultAddress) {
      throw this.throwError('VAULT_NOT_FOUND_ERROR', tokenSymbol);
    }
    return vaultAddress;
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
    params?: Params
  ): Promise<ApiResponse<TransactionMessage>> {
    try {
      const signer = createNoopSigner(userAddress);
      var decimalAmount: Decimal;
      if (amount instanceof Decimal) {
        decimalAmount = amount;
      } else {
        decimalAmount = this.convertToDecimal(amount);
      }
      
      const depositIxs = await this.vault.depositIxs(signer, decimalAmount);

      let transactionMessage = await this.baseTx(userAddress.toString(), params);
      
      depositIxs.depositIxs.forEach(instruction => {
        transactionMessage = appendTransactionMessageInstruction(
          instruction, 
          transactionMessage
        ) as any;
      });

      depositIxs.stakeInFarmIfNeededIxs.forEach(instruction => {
        transactionMessage = appendTransactionMessageInstruction(
          instruction, 
          transactionMessage
        ) as any;
      });

      return {
        result: transactionMessage
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
    params?: Params
  ): Promise<ApiResponse<TransactionMessage>> {
    try {
      const signer = createNoopSigner(userAddress);
      var sharesDecimal: Decimal;
      if (sharesAmount instanceof Decimal) {
        sharesDecimal = sharesAmount;
      } else {
        sharesDecimal = this.convertToDecimal(sharesAmount);
      }

      const withdrawIxs = await this.vault.withdrawIxs(signer, sharesDecimal);

      let transactionMessage = await this.baseTx(userAddress.toString(), params);
      
      withdrawIxs.unstakeFromFarmIfNeededIxs.forEach(instruction => {
        transactionMessage = appendTransactionMessageInstruction(
          instruction, 
          transactionMessage
        ) as any;
      });

      withdrawIxs.withdrawIxs.forEach(instruction => {
        transactionMessage = appendTransactionMessageInstruction(
          instruction, 
          transactionMessage
        ) as any;
      });

      withdrawIxs.postWithdrawIxs.forEach(instruction => {
        transactionMessage = appendTransactionMessageInstruction(
          instruction, 
          transactionMessage
        ) as any;
      });

      return {
        result: transactionMessage
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  private async baseTx(
    sender: string,
    params?: Params,
  ): Promise<TransactionMessage> {
    const finalLatestBlockhash =
      params?.finalLatestBlockhash ||
      (await this.connection.getLatestBlockhash().send()).value;

    let transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(address(sender), tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
    );

    return transactionMessage;
  }
}