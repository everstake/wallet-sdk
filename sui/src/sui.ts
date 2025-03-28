/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { DelegatedStake, SuiClient } from '@mysten/sui/client';
import { Blockchain } from './utils';
import { SUI_MIN_AMOUNT_FOR_STAKE, SUI_NETWORK_ADDRESSES } from './constants';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/error';
import { SuiNetworkType } from './types';
import {
  isValidSuiAddress,
  SUI_SYSTEM_STATE_OBJECT_ID,
} from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';

export class Sui extends Blockchain {
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  public validatorAddress!: string;
  public client!: SuiClient;

  constructor(network: SuiNetworkType = 'mainnet', url?: string) {
    super();

    const networkAddresses = SUI_NETWORK_ADDRESSES[network];

    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }

    this.validatorAddress = networkAddresses.validatorAddress;
    this.client = new SuiClient({
      url: url ?? networkAddresses.rpcUrl,
    });
  }

  /**
   * Retrieves the delegated stakes for a given address.
   *
   * @param address - The address to fetch staking balances for.
   *
   * @returns A promise that resolves to an array of DelegatedStake objects.
   *
   * @throws Will throw an error if the address is not valid or if the API call fails.
   */
  public async getStakeBalanceByAddress(
    address: string,
  ): Promise<DelegatedStake[]> {
    if (!this.isAddress(address)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const delegatedStakes = await this.client.getStakes({ owner: address });

      return delegatedStakes;
    } catch (error) {
      throw this.handleError('STAKE_BALANCE_ERROR', error);
    }
  }

  /**
   * Retrieves the Sui balance for a given address.
   *
   * @param address - The address to fetch the balance for.
   *
   * @returns A promise that resolves to a BigNumber representing the balance.
   *
   * @throws Will throw an error if the address is not valid or if the API call fails.
   */
  public async getBalanceByAddress(address: string): Promise<bigint> {
    if (!this.isAddress(address)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const balance = await this.client.getBalance({ owner: address });

      return BigInt(balance.totalBalance);
    } catch (error) {
      throw this.handleError('USER_BALANCES_ERROR', error);
    }
  }

  /**
   * Creates a transaction to transfer SUI tokens to a recipient.
   *
   * @param recipientAddress - The address of the recipient.
   * @param amountInMist - The amount in MIST to transfer as a string.
   *
   * @returns A promise that resolves to a Transaction object ready to be signed and executed.
   *
   * @throws Will throw an error if the recipient address is not valid or if the transaction preparation fails.
   */
  public async sendTransfer(
    recipientAddress: string,
    amountInMist: string,
  ): Promise<Transaction> {
    const amountBn = BigInt(amountInMist);
    if (!this.isAddress(recipientAddress)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const tx = new Transaction();

      const coin = tx.splitCoins(tx.gas, [amountBn.toString()]);

      tx.transferObjects([coin], recipientAddress);

      return tx;
    } catch (error) {
      throw this.handleError('TRANSFER_ERROR', error);
    }
  }

  /**
   * Creates a transaction to stake SUI tokens with a validator.
   *
   * @param amountInMist - The amount in MIST to stake as a string.
   *
   * @returns A promise that resolves to a Transaction object ready to be signed and executed.
   *
   * @throws Will throw an error if the amount is less than the minimum required for staking
   * or if the transaction preparation fails.
   */
  public async stake(amountInMist: string): Promise<Transaction> {
    const amountBn = BigInt(amountInMist);
    if (amountBn < SUI_MIN_AMOUNT_FOR_STAKE) {
      this.throwError('MIN_STAKE_AMOUNT_ERROR');
    }

    try {
      const tx = new Transaction();
      const stakeCoin = tx.splitCoins(tx.gas, [amountBn.toString()]);

      tx.moveCall({
        target: '0x3::sui_system::request_add_stake',
        arguments: [
          tx.sharedObjectRef({
            objectId: SUI_SYSTEM_STATE_OBJECT_ID,
            initialSharedVersion: 1,
            mutable: true,
          }),
          stakeCoin,
          tx.pure.address(this.validatorAddress),
        ],
      });

      return tx;
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }

  /**
   * Creates a transaction to unstake SUI tokens from a validator.
   *
   * @param stakedSuiId - The ID of the staked SUI object to withdraw.
   *
   * @returns A promise that resolves to a Transaction object ready to be signed and executed.
   *
   * @throws Will throw an error if the transaction preparation fails.
   */
  public async unstake(stakedSuiId: string): Promise<Transaction> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: '0x3::sui_system::request_withdraw_stake',
        arguments: [
          tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
          tx.object(stakedSuiId),
        ],
      });

      return tx;
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  /**
   * Validates if a string is a valid Sui address.
   *
   * @param address - The string to validate as a Sui address.
   *
   * @returns A boolean indicating whether the string is a valid Sui address.
   */
  private isAddress(address: string): boolean {
    return isValidSuiAddress(address);
  }
}
