/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  Aptos as AptosSDK,
  AptosConfig,
  MoveFunctionId,
  MoveValue,
  InputViewFunctionData,
} from '@aptos-labs/ts-sdk';

import { Blockchain } from '../../utils';
import { CheckToken, SetStats } from '../../utils/api';

import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';

import {
  APTOS_COIN_TYPE,
  CHAIN,
  DECIMAL,
  LOWER_AMOUNT,
  MIN_AMOUNT,
  RPC_URL,
  VALIDATOR_ADDRESS,
} from './constants';
import BigNumber from 'bignumber.js';
import { COMMON_ERROR_MESSAGES } from '../../utils/constants/errors';
import { StakeActionParams, StakeBalance } from './types';

/**
 * The `Aptos` class extends the `Blockchain` class and provides methods for interacting with the Aptos network.
 *
 * It initializes an instance of the Aptos SDK client and manages standardized error messages.
 *
 * @extends {Blockchain}
 *
 * @property {Aptos} client - The Aptos SDK client instance for communicating with the Aptos network.
 * @property ERROR_MESSAGES - Standardized error messages used by the AptosClient.
 * @property ORIGINAL_ERROR_MESSAGES - Original/raw error messages for debugging or internal reference.
 *
 * @class
 */

export class Aptos extends Blockchain {
  public client: AptosSDK;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(rpc: string = RPC_URL) {
    super();
    const config = new AptosConfig({ fullnode: rpc });
    this.client = new AptosSDK(config);
  }

  /** getStakeBalanceByAddress - get stake by address
   * @param {string} address - address
   * @returns {Promise<object>} Promise object with balances
   */
  public async getStakeBalanceByAddress(
    address: string,
  ): Promise<StakeBalance> {
    try {
      const func: MoveFunctionId = '0x1::delegation_pool::get_stake';
      const arg = {
        payload: {
          function: func,
          typeArguments: [],
          functionArguments: [VALIDATOR_ADDRESS, address],
        },
      };

      const balance = await this.client.view(arg);
      const [activeRaw, inactiveRaw, pendingRaw] = balance ?? [];

      if (activeRaw == null || inactiveRaw == null || pendingRaw == null) {
        throw new Error('One or more stake balance values are missing');
      }

      return {
        // after STAKE, one of `active` + `pending_active` stake
        active: this.SetDecimal(
          new BigNumber(activeRaw.toString()),
          DECIMAL,
        ).toString(),
        // one of `inactive` stake FOR each past observed lockup cycle (OLC) on the stake pool
        inactive: this.SetDecimal(
          new BigNumber(inactiveRaw.toString()),
          DECIMAL,
        ).toString(),
        // after UNLOCK, one of `pending_inactive` stake scheduled during this ongoing OLC
        pending_inactive: this.SetDecimal(
          new BigNumber(pendingRaw.toString()),
          DECIMAL,
        ).toString(),
      };
    } catch (error) {
      throw this.handleError('GET_STAKE_BALANCE_ERR', error);
    }
  }

  /** getLockupSecs - get lockup durations in sec
   * @returns {Promise<string>} Promise number of louckup in seconds
   */
  public async getLockupSecs(): Promise<MoveValue> {
    try {
      const func: MoveFunctionId = '0x1::stake::get_remaining_lockup_secs';
      const arg = {
        payload: {
          function: func,
          typeArguments: [],
          functionArguments: [VALIDATOR_ADDRESS],
        },
      };
      const result = await this.client.view(arg);

      return result[0];
    } catch (error) {
      throw this.handleError('GET_LOCKUP_SECS_ERR', error);
    }
  }

  /** getBalanceByAddress - get balance by address
   * @param {string} address - address
   * @returns {Promise<string>} Promise object with balance
   */
  public async getBalanceByAddress(address: string): Promise<string> {
    try {
      const resources = await this.client.getAccountResources({
        accountAddress: address,
      });

      const accountResource = resources.find((r) => r.type === APTOS_COIN_TYPE);
      const { data } = accountResource ?? {};

      if (!this.isAptosCoinData(data))
        throw new Error(ERROR_MESSAGES.INVALID_APTOS_COIN_RECOURCE_FORMAT);

      return this.SetDecimal(
        new BigNumber(data?.coin.value.toString()),
        DECIMAL,
      ).toString();
    } catch (error) {
      throw this.handleError('GET_BALANCE_ERR', error);
    }
  }

  /** sendTransfer - send amount to recipient
   * @param {string} address - from address
   * @param {string} recipientAddress - recipient Address
   * @param {string} amount - amount of transfer
   * @returns {Promise<object>} Promise object with tx message
   */
  public async sendTransfer(
    recipientAddress: string,
    amount: string,
  ): Promise<InputViewFunctionData> {
    if (typeof amount !== 'string') {
      throw new Error(ERROR_MESSAGES.WRONG_TYPE_MESSAGE);
    }
    const amountBN = new BigNumber(amount);
    try {
      return {
        function: '0x1::aptos_account::transfer',
        typeArguments: [],
        functionArguments: [
          recipientAddress,
          this.SetDecimal(amountBN, DECIMAL).toString(),
        ],
      };
    } catch (error) {
      throw this.handleError('SEND_TRANSFER_ERR', error);
    }
  }

  /** getMinAmountForStake - get min amount for stake
   * @param {string} address - staker address
   * @returns {Promise<string>} Promise with min number
   */
  public async getMinAmountForStake(address: string): Promise<string> {
    try {
      const balance = await this.getStakeBalanceByAddress(address);

      if (new BigNumber(MIN_AMOUNT).minus(balance.active).lte(0)) {
        return LOWER_AMOUNT.toString();
      } else {
        return new BigNumber(MIN_AMOUNT).minus(balance.active).toString();
      }
    } catch (error) {
      throw this.handleError('GET_MIN_STAKE_AMOUNT_ERR', error);
    }
  }

  /** stake - make stake tx
   * @param {string} token - Auth API token
   * @param {string} address - staker address
   * @param {string} amount - Amount of stake
   * @returns {Promise<Object>} Promise with TX payload
   */
  public async stake({
    token,
    address,
    amount,
  }: StakeActionParams): Promise<InputViewFunctionData> {
    if (typeof amount !== 'string') {
      throw new Error(ERROR_MESSAGES.WRONG_TYPE_MESSAGE);
    }
    if (!(await CheckToken(token))) {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
    const amountBN = new BigNumber(amount);
    const balance = await this.getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.plus(amountBN);

    if (activeAfter.lt(MIN_AMOUNT)) {
      throw new Error(
        `Active stake should be more than ${MIN_AMOUNT.toString()}`,
      );
    }
    try {
      await SetStats({
        token,
        action: 'stake',
        amount: Number(amount),
        address,
        chain: CHAIN,
      });

      return {
        function: '0x1::delegation_pool::add_stake',
        typeArguments: [],
        functionArguments: [
          VALIDATOR_ADDRESS,
          this.UnsetDecimal(amountBN, DECIMAL).toString(),
        ],
      };
    } catch (error) {
      throw this.handleError('STAKE_ERR', error);
    }
  }

  /** reactivate - make reactivate tx
   * @param {string} token - Auth API token
   * @param {string} address - staker address
   * @param {string} amount - Amount of stake
   * @returns {Promise<Object>} Promise with reactivated TX payload
   */
  public async reactivate({
    token,
    address,
    amount,
  }: StakeActionParams): Promise<InputViewFunctionData> {
    if (typeof amount !== 'string') {
      throw new Error(ERROR_MESSAGES.WRONG_TYPE_MESSAGE);
    }
    if (!(await CheckToken(token))) {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
    const amountBN = new BigNumber(amount);
    const balance = await this.getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.plus(amountBN);

    if (activeAfter.lt(MIN_AMOUNT) && !activeAfter.isEqualTo(0)) {
      throw new Error(
        `Active stake should be more than ${MIN_AMOUNT.toString()}`,
      );
    }

    const pending = new BigNumber(balance.pending_inactive);
    const pendingAfter = pending.minus(amountBN);

    if (pendingAfter.lt(MIN_AMOUNT) && !pendingAfter.isEqualTo(0)) {
      throw new Error(
        `Pending inactive stake should be more than ${MIN_AMOUNT.toString()}`,
      );
    }

    try {
      await SetStats({
        token,
        action: 'reactivate_stake',
        amount: Number(amount),
        address,
        chain: CHAIN,
      });

      return {
        function: '0x1::delegation_pool::reactivate_stake',
        typeArguments: [],
        functionArguments: [
          VALIDATOR_ADDRESS,
          this.UnsetDecimal(amountBN, DECIMAL).toString(),
        ],
      };
    } catch (error) {
      throw this.handleError('REACTIVATE_ERR', error);
    }
  }

  /** unlock - make unlock tx
   * @param {string} token - Auth API token
   * @param {string} address - staker address
   * @param {string} amount - Amount of stake
   * @returns {Promise<Object>} Promise with unlocked TX payload
   */
  public async unlock({
    token,
    address,
    amount,
  }: StakeActionParams): Promise<InputViewFunctionData> {
    if (typeof amount !== 'string') {
      throw new Error(ERROR_MESSAGES.WRONG_TYPE_MESSAGE);
    }
    if (!(await CheckToken(token))) {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
    const amountBN = new BigNumber(amount);
    const balance = await this.getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.minus(amountBN);

    if (activeAfter.lt(MIN_AMOUNT) && !activeAfter.isEqualTo(0)) {
      throw new Error(
        `Active stake should be more than ${MIN_AMOUNT.toString()}`,
      );
    }

    try {
      await SetStats({
        token,
        action: 'unlock_stake',
        amount: Number(amount),
        address,
        chain: CHAIN,
      });

      return {
        function: '0x1::delegation_pool::unlock',
        typeArguments: [],
        functionArguments: [
          VALIDATOR_ADDRESS,
          this.UnsetDecimal(amountBN, DECIMAL).toString(),
        ],
      };
    } catch (error) {
      throw this.handleError('UNLOCK_ERR', error);
    }
  }

  /** unstake - make unstake tx
   * @param {string} token - Auth API token
   * @param {string} address - staker address
   * @param {string} amount - Amount of stake
   * @returns {Promise<Object>} Promise with unstake TX payload
   */
  public async unstake({
    token,
    address,
    amount,
  }: StakeActionParams): Promise<InputViewFunctionData> {
    if (typeof amount !== 'string') {
      throw new Error(ERROR_MESSAGES.WRONG_TYPE_MESSAGE);
    }
    if (!(await CheckToken(token))) {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
    const amountBN = new BigNumber(amount);
    const balance = await this.getStakeBalanceByAddress(address);
    const inactive = new BigNumber(balance.inactive);

    if (inactive.lt(amountBN)) {
      throw new Error(
        `Not enough inactive balance. You have ${inactive.toString()} APT`,
      );
    }

    try {
      await SetStats({
        token,
        action: 'unstake',
        amount: Number(amount),
        address,
        chain: CHAIN,
      });

      return {
        function: '0x1::delegation_pool::withdraw',
        typeArguments: [],
        functionArguments: [
          VALIDATOR_ADDRESS,
          this.UnsetDecimal(amountBN, DECIMAL).toString(),
        ],
      };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERR', error);
    }
  }

  /**
   * Type guard to check if the provided data matches the expected Aptos coin resource structure.
   *
   * This function validates that the input is a non-null object containing a `coin` property,
   * and that `coin` itself is a non-null object with a `value` property of type number or string.
   *
   * @param data - The value to check.
   * @returns `true` if `data` has a valid Aptos coin structure, otherwise `false`.
   */
  private isAptosCoinData(data: unknown): data is {
    coin: {
      value: number | string;
    };
  } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'coin' in data &&
      typeof data.coin === 'object' &&
      data.coin !== null &&
      'value' in data.coin
    );
  }

  /** SetDecimal convert min unit amount to amount with decimals (example: 1e18 WEI -> 1 ETH)
   * @param {BigNumber} integerAmount - integer amount in min units
   * @param {number} decimals - decimals/precision (eth: 18, atom: 9 ...)
   * @returns {BigNumber} amount with decimals
   */
  private SetDecimal(integerAmount: BigNumber, decimals: number): BigNumber {
    const divider = new BigNumber(10).exponentiatedBy(new BigNumber(decimals));

    return integerAmount.dividedBy(divider);
  }

  /** UnsetDecimal convert token amount to min unit amount (example: 1 ETH -> 1e18 WEI)
   * @param {BigNumber} amount - token amount (could be with comma)
   * @param {number} decimals - decimals/precision (eth: 18, atom: 9 ...)
   * @returns {BigNumber} amount - (big) integer amount
   */
  private UnsetDecimal(amount: BigNumber, decimals: number): BigNumber {
    const multiplier = new BigNumber(10).exponentiatedBy(
      new BigNumber(decimals),
    );

    return new BigNumber(amount.multipliedBy(multiplier).toFixed(0));
  }
}
