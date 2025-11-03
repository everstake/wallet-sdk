/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  createSolanaRpc,
  Address,
  createNoopSigner,
} from '@solana/kit';

import {
  KaminoVault,
  VaultHoldings,
  VaultAPYs,
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
  TransactionResponse
} from './types';

/**
 * The `KaminoSDK` class extends the `Blockchain` class and provides methods for interacting with Kamino vaults on Solana.
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
export class KaminoSDK extends Blockchain {
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ERROR_MESSAGES;
  
  private connection: any;
  private vault: KaminoVault;
  private tokenSymbol: SupportedToken;

  /**
   * Creates a new instance of the KaminoSDK.
   *
   * @param tokenSymbol - The supported token symbol for vault operations.
   * @param rpcUrl - Optional custom RPC URL. If not provided, uses the default Solana mainnet RPC.
   *
   * @throws Throws an error if the token symbol is not supported.
   * @throws Throws an error if there's an issue during SDK initialization.
   */
  constructor(tokenSymbol: SupportedToken, rpcUrl?: string) {
    super();
    
    const vaultAddress = this.getVaultAddress(tokenSymbol);
    this.tokenSymbol = tokenSymbol;
    
    try {
      const connectionUrl = rpcUrl || 'https://api.mainnet-beta.solana.com';
      this.connection = createSolanaRpc(connectionUrl);
      
      // Initialize vault
      this.vault = new KaminoVault(this.connection, vaultAddress);
    } catch (error) {
      throw this.handleError('INITIALIZATION_ERROR', error);
    }
  }

  /**
   * Retrieves the vault address for a given token symbol.
   *
   * @param tokenSymbol - The supported token symbol to get vault address for.
   *
   * @throws Throws an error if the vault address is not found for the token.
   *
   * @returns Returns the vault address.
   */
  private getVaultAddress(tokenSymbol: SupportedToken) {
    const vaultAddress = VAULTS[tokenSymbol];
    if (!vaultAddress) {
      throw this.throwError('VAULT_NOT_FOUND_ERROR', tokenSymbol);
    }
    return vaultAddress;
  }

  /**
   * Converts various numeric types to Decimal for consistent numerical operations.
   *
   * @param amount - The amount to convert (accepts number, string, or bigint).
   *
   * @returns Returns a Decimal instance of the amount.
   */
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
   * @returns Returns a promise that resolves with the vault APY information.
   */
  async getVaultAPYs(): Promise<ApiResponse<VaultAPYs>> {
    try {
      const apys = await this.vault.getAPYs();
      return { result: apys };
    } catch (error) {
      throw this.handleError('VAULT_LOAD_ERROR', error);
    }
  }

  /**
   * Fetches the current vault exchange rate (tokens per share).
   *
   * @throws Throws an error if there's an issue loading exchange rate.
   *
   * @returns Returns a promise that resolves with the exchange rate as string.
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
   * Creates a deposit transaction to the vault.
   *
   * @param userAddress - The public key of the user account.
   * @param amount - The amount to deposit.
   *
   * @throws Throws an error if there's an issue creating the deposit transaction.
   *
   * @returns Returns a promise that resolves with the deposit transaction response.
   */
  async deposit(userAddress: Address, amount: number | string | bigint | Decimal): Promise<TransactionResponse> {
    try {
      const signer = createNoopSigner(userAddress);
      var decimalAmount: Decimal;
      if (amount instanceof Decimal) {
        decimalAmount = amount;
      } else {
        decimalAmount = this.convertToDecimal(amount);
      }
      
      const depositIxs = await this.vault.depositIxs(signer, decimalAmount);

      return {
        instructions: [...depositIxs.depositIxs, ...depositIxs.stakeInFarmIfNeededIxs],
        userAddress: userAddress.toString(),
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
   *
   * @throws Throws an error if there's issue creating the withdraw transaction.
   *
   * @returns Returns a promise that resolves with the withdraw transaction response.
   */
  async withdraw(userAddress: Address, sharesAmount: number | string | bigint | Decimal): Promise<TransactionResponse> {
    try {
      const signer = createNoopSigner(userAddress);
      var sharesDecimal: Decimal;
      if (sharesAmount instanceof Decimal) {
        sharesDecimal = sharesAmount;
      } else {
        sharesDecimal = this.convertToDecimal(sharesAmount);
      }

      const withdrawIxs = await this.vault.withdrawIxs(signer, sharesDecimal);

      return {
        instructions:[...withdrawIxs.unstakeFromFarmIfNeededIxs, ...withdrawIxs.withdrawIxs, ...withdrawIxs.postWithdrawIxs],
        userAddress: userAddress.toString(),
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }
}