/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { DelegatedStake, SuiClient } from '@mysten/sui/client';
import { Blockchain } from '../utils';
import {
  SUI_BASE_NUM,
  SUI_MIN_AMOUNT_FOR_STAKE,
  SUI_NETWORK_ADDRESSES,
} from './constants';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/error';
import { SuiNetworkType } from './types';
import BigNumber from 'bignumber.js';
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
    this.initializeNetwork(network, url);
  }

  private initializeNetwork(network: SuiNetworkType, url?: string) {
    const networkAddresses = SUI_NETWORK_ADDRESSES[network];

    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }
    this.client = new SuiClient({
      url: url ?? networkAddresses.rpcUrl,
    });
  }

  public async getStakeBalanceByAddress(
    address: string,
  ): Promise<DelegatedStake[]> {
    if (!this.isAddress(address)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const delegatedStakes = await this.client.getStakes({ owner: address });
      // const totalStaked = delegatedStakes
      //   .filter(stake => stake.validatorAddress === this.validatorAddress)
      //   .flatMap(stake => stake.stakes)
      //   .reduce((total, stake) => total.plus(stake.principal), new BigNumber(0));

      return delegatedStakes;
    } catch (error) {
      throw this.handleError('STAKE_BALANCE_ERROR', error);
    }
  }

  public async getBalanceByAddress(address: string): Promise<BigNumber> {
    if (!this.isAddress(address)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const balance = await this.client.getBalance({ owner: address });

      return new BigNumber(balance.totalBalance);
    } catch (error) {
      throw this.handleError('USER_BALANCES_ERROR', error);
    }
  }

  public async sendTransfer(
    recipientAddress: string,
    amount: string,
  ): Promise<Transaction> {
    if (!this.isAddress(recipientAddress)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const tx = new Transaction();

      const coin = tx.splitCoins(tx.gas, [
        SUI_BASE_NUM.multipliedBy(amount).toString(),
      ]);

      tx.transferObjects([coin], recipientAddress);

      return tx;
    } catch (error) {
      throw this.handleError('TRANSFER_ERROR', error);
    }
  }

  public async stake(amount: string) {
    if (+amount < SUI_MIN_AMOUNT_FOR_STAKE) {
      this.throwError('MIN_STAKE_AMOUNT_ERROR');
    }

    try {
      const tx = new Transaction();
      const stakeCoin = tx.splitCoins(tx.gas, [
        SUI_BASE_NUM.multipliedBy(amount).toString(),
      ]);

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

  public async unstake(stakedSuiId: string) {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: '0x3::sui_system::request_withdraw_stake',
        arguments: [
          tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
          tx.object(stakedSuiId),
        ],
      });
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  private isAddress(address: string): boolean {
    return isValidSuiAddress(address);
  }
}
