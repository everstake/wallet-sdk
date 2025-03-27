/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Blockchain } from '../../utils';
import { CheckToken, SetStats } from '../../utils/api';
import { COMMON_ERROR_MESSAGES } from '../../utils/constants/errors';

import Web3, { Contract, HttpProvider, Numbers } from 'web3';

import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import {
  ABI_CONTRACT_APPROVE,
  ABI_CONTRACT_BUY,
  ABI_CONTRACT_STAKING,
} from './abi';
import {
  ADDRESS_CONTRACT_APPROVE,
  ADDRESS_CONTRACT_APPROVE_POL,
  ADDRESS_CONTRACT_BUY,
  ADDRESS_CONTRACT_STAKING,
  CHAIN,
  CLAIM_REWARDS_BASE_GAS,
  CLAIM_UNDELEGATE_BASE_GAS,
  DELEGATE_BASE_GAS,
  MIN_AMOUNT,
  RESTAKE_BASE_GAS,
  RPC_URL,
  UNDELEGATE_BASE_GAS,
  WITHDRAW_EPOCH_DELAY,
} from './constants';
import BigNumber from 'bignumber.js';

/**
 * The `Polygon` class extends the `Blockchain` class and provides methods for interacting with the Polygon network.
 *
 * It handles initialization of Web3 and multiple contract instances, including approval contracts,
 * buy contracts, and staking contracts. It also manages error messages related to contract operations.
 *
 * @property {Web3} web3 - The Web3 instance used for interacting with the Polygon network.
 * @property {Contract} contract_approve - The contract instance for token approval.
 * @property {Contract} contract_approve_pol - The contract instance for POL token approval.
 * @property {Contract} contract_buy - The contract instance for token purchase logic.
 * @property {Contract} contract_staking - The contract instance for staking logic.
 * @property ERROR_MESSAGES - The standardized error messages for the Polygon class.
 * @property ORIGINAL_ERROR_MESSAGES - The raw/original error messages for internal mapping or debugging.
 *
 * @constructor
 * Creates an instance of the `Polygon` class.
 * @param {string} [rpc=RPC_URL] - The RPC URL of the Polygon network.
 */

export class Polygon extends Blockchain {
  public contract_approve!: Contract<typeof ABI_CONTRACT_APPROVE>;
  public contract_approve_pol!: Contract<typeof ABI_CONTRACT_APPROVE>;
  public contract_buy: Contract<typeof ABI_CONTRACT_BUY>;
  public contract_staking: Contract<typeof ABI_CONTRACT_BUY>;

  private web3!: Web3;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(rpc: string = RPC_URL) {
    super();
    const httpProvider = new HttpProvider(rpc);
    this.web3 = new Web3(httpProvider);
    this.contract_approve = new this.web3.eth.Contract(
      ABI_CONTRACT_APPROVE,
      ADDRESS_CONTRACT_APPROVE,
    );
    this.contract_approve_pol = new this.web3.eth.Contract(
      ABI_CONTRACT_APPROVE,
      ADDRESS_CONTRACT_APPROVE_POL,
    );
    this.contract_buy = new this.web3.eth.Contract(
      ABI_CONTRACT_BUY,
      ADDRESS_CONTRACT_BUY,
    );
    this.contract_staking = new this.web3.eth.Contract(
      ABI_CONTRACT_STAKING,
      ADDRESS_CONTRACT_STAKING,
    );
  }

  /**
   * Checks if a transaction is still pending or has been confirmed.
   *
   * @param {string} hash - The transaction hash to check.
   * @returns {Promise<{ result: boolean }>}
   *
   * @throws {Error} Throws an error with code `'TRANSACTION_LOADING_ERR'` if an issue occurs while fetching the transaction status.
   *
   */
  public async isTransactionLoading(hash: string) {
    try {
      const result = await this.web3.eth.getTransactionReceipt(hash);
      if (result && result.status) {
        return { result: false };
      } else {
        await this.isTransactionLoading(hash);

        return { result: true };
      }
    } catch (error) {
      throw this.handleError('TRANSACTION_LOADING_ERR', error);
    }
  }
  /** approve returns TX loading status
   * @param {string} address - user's address
   * @param {string|number} amount - amount for approve
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object the result of boolean type
   */
  public async approve(address: string, amount: string, isPOL = false) {
    const amountWei = await this.web3.utils.toWei(amount.toString(), 'ether');

    if (new BigNumber(amountWei).isLessThan(MIN_AMOUNT)) {
      throw new Error(
        `Min Amount ${this.web3.utils.fromWei(MIN_AMOUNT.toString(), 'ether').toString()} matic`,
      );
    }

    const contract = isPOL ? this.contract_approve_pol : this.contract_approve;
    if (!contract?.methods?.approve) return;

    try {
      const gasEstimate = await contract.methods
        .approve(ADDRESS_CONTRACT_STAKING, amountWei)
        .estimateGas({ from: address });

      // Create the transaction
      return {
        from: address,
        to: contract.options.address,
        gasLimit: gasEstimate,
        data: contract.methods
          .approve(ADDRESS_CONTRACT_STAKING, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('APPROVE_ERR', error);
    }
  }

  /** delegate makes unsigned delegation TX
   * @param {string} token - auth token
   * @param {string} address - user's address
   * @param {string|number} amount - amount for approve
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object represents the unsigned TX object
   */
  public async delegate(
    token: string,
    address: string,
    amount: string,
    isPOL = false,
  ) {
    if (await CheckToken(token)) {
      const amountWei = await this.web3.utils.toWei(amount.toString(), 'ether');
      if (new BigNumber(amountWei).isLessThan(MIN_AMOUNT))
        throw new Error(`Min Amount ${MIN_AMOUNT} wei matic`);

      try {
        const allowedAmount = await this.getAllowance(address);
        if (
          allowedAmount &&
          new BigNumber(allowedAmount).isLessThan(amountWei)
        ) {
          throw new Error(`Allowance less than amount`);
        }

        const methods = this.contract_buy?.methods;

        if (!methods?.buyVoucherPOL || !methods?.buyVoucher) return;
        const method = isPOL
          ? methods.buyVoucherPOL(amountWei, 0)
          : methods.buyVoucher(amountWei, 0);

        // Create the transaction
        const tx = {
          from: address,
          to: ADDRESS_CONTRACT_BUY,
          gasLimit: DELEGATE_BASE_GAS,
          data: method.encodeABI(),
        };

        await SetStats({
          token,
          action: 'stake',
          amount: Number(amount),
          address,
          chain: CHAIN,
        });
        // Sign the transaction

        return tx;
      } catch (error) {
        throw this.handleError('DELEGATE_ERR', error);
      }
    } else {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
  }
  /** undelegate makes unsigned undelegate TX
   * @param {string} token - auth token
   * @param {string} address - user's address
   * @param {string|number} amount - amount for approve
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object represents the unsigned TX object
   */
  public async undelegate(
    token: string,
    address: string,
    amount: string,
    isPOL = false,
  ) {
    if (await CheckToken(token)) {
      try {
        const amountWei = await this.web3.utils.toWei(
          amount.toString(),
          'ether',
        );
        const delegatedBalance = await this.getTotalDelegate(address);

        if (
          delegatedBalance &&
          delegatedBalance.isLessThan(BigNumber(amount))
        ) {
          throw new Error(`Delegated balance less than requested amount`);
        }

        const methods = this.contract_buy.methods;

        if (!methods.sellVoucher_newPOL || !methods.sellVoucher_new) return;
        const method = isPOL
          ? methods.sellVoucher_newPOL(amountWei, amountWei)
          : methods.sellVoucher_new(amountWei, amountWei);

        // Create the transaction
        const tx = {
          from: address,
          to: ADDRESS_CONTRACT_BUY,
          gasLimit: UNDELEGATE_BASE_GAS,
          data: method.encodeABI(),
        };

        await SetStats({
          token,
          action: 'unstake',
          amount: Number(amount),
          address,
          chain: CHAIN,
        });

        return tx;
      } catch (error) {
        throw this.handleError('UNDELEGATE_ERR', error);
      }
    } else {
      throw new Error(COMMON_ERROR_MESSAGES.TOKEN_ERROR);
    }
  }

  /** claimUndelegate makes unsigned claim undelegate TX
   * @param {string} address - user's address
   * @param {number} unbondNonce - unbound nonce
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object represents the unsigned TX object
   */
  public async claimUndelegate(
    address: string,
    unbondNonce = 0,
    isPOL = false,
  ) {
    const unbond = await this.getUnbond(address, unbondNonce);
    if (unbond == null) return;

    if (BigNumber(unbond.amount).isZero()) throw new Error(`Nothing to claim`);

    const currentEpoch = await this.getCurrentEpoch();
    if (currentEpoch == null) return;

    if (
      BigNumber(currentEpoch).isLessThan(
        BigNumber(unbond.withdrawEpoch).plus(BigNumber(WITHDRAW_EPOCH_DELAY)),
      )
    ) {
      throw new Error(`Current epoch less than withdraw delay`);
    }

    const methods = this.contract_buy.methods;

    if (!methods.unstakeClaimTokens_newPOL || !methods.unstakeClaimTokens_new)
      return;

    const method = isPOL
      ? methods.unstakeClaimTokens_newPOL(unbond.unbondNonces)
      : methods.unstakeClaimTokens_new(unbond.unbondNonces);

    return {
      from: address,
      to: ADDRESS_CONTRACT_BUY,
      gasLimit: CLAIM_UNDELEGATE_BASE_GAS,
      data: method.encodeABI(),
    };
  }

  /** reward makes unsigned claim reward TX
   * @param {string} address - user's address
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object represents the unsigned TX object
   */
  public async reward(address: string, isPOL = false) {
    const methods = this.contract_buy.methods;
    if (!methods.withdrawRewardsPOL || !methods.withdrawRewards) return;

    const method = isPOL
      ? methods.withdrawRewardsPOL()
      : methods.withdrawRewards();

    // Create the transaction
    return {
      from: address,
      to: ADDRESS_CONTRACT_BUY,
      gasLimit: CLAIM_REWARDS_BASE_GAS,
      data: method.encodeABI(),
    };
  }

  /** restake makes unsigned restake reward TX
   * @param {string} address - user's address
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<Object>} Promise object represents the unsigned TX object
   */
  public async restake(address: string, isPOL = false) {
    const methods = this.contract_buy.methods;
    if (!methods.restakePOL || !methods.restake) return;

    const method = isPOL ? methods.restakePOL() : methods.restake();

    // Create the transaction
    return {
      from: address,
      to: ADDRESS_CONTRACT_BUY,
      gasLimit: RESTAKE_BASE_GAS,
      data: method.encodeABI(),
    };
  }

  /** getReward returns reward number
   * @param {string} address - user's address
   * @returns {Promise<BigNumber>} Promise with number of the reward
   */
  public async getReward(address: string) {
    try {
      const methods = this.contract_buy.methods;
      if (!methods.getLiquidRewards) return;

      const result = await methods.getLiquidRewards(address).call();
      if (!this.isNumbers(result)) return;

      return new BigNumber(this.web3.utils.fromWei(result, 'ether'));
    } catch (error) {
      throw this.handleError('GET_REWARD_ERR', error);
    }
  }

  /** getAllowance returns allowed number for spender
   * @param {string} owner - tokens owner
   * @param {string} spender - contract spender
   * @param {boolean} isPOL - is POL token (false - old MATIC)
   * @returns {Promise<string>} Promise allowed number for spender
   */
  public async getAllowance(
    owner: string,
    spender = ADDRESS_CONTRACT_STAKING,
    isPOL = false,
  ): Promise<string | undefined> {
    const contract = isPOL ? this.contract_approve_pol : this.contract_approve;
    if (!contract.methods.allowance) return;

    try {
      return await contract.methods.allowance(owner, spender).call();
    } catch (error) {
      throw this.handleError('GET_ALLOWANCE_ERR', error);
    }
  }

  /** getTotalDelegate returns total delegated number
   * @param {string} address - user's address
   * @returns {Promise<BigNumber>} Promise with number of the delegation
   */
  public async getTotalDelegate(address: string) {
    try {
      const methods = this.contract_buy.methods;
      if (!methods.getTotalStake) return;

      const result = await methods.getTotalStake(address).call();
      const res = result?.[0];
      if (res == null) return;

      return new BigNumber(this.web3.utils.fromWei(res, 'ether'));
    } catch (error) {
      throw this.handleError('GET_TOTAL_DELEGATE_ERR', error);
    }
  }

  /** getUnbond returns unbound data
   * @param {string} address - user's address
   * @param {number} unbondNonce - unbound nonce
   * @returns {Promise<Object>} Promise Object with unbound data
   */
  public async getUnbond(address: string, unbondNonce = 0) {
    try {
      const methods = this.contract_buy.methods;
      if (!methods.unbondNonces || !methods.unbonds_new) return;

      // Get recent nonces if not provided
      const unbondNonces =
        unbondNonce === 0
          ? await methods.unbondNonces(address).call()
          : unbondNonce;
      const result = await methods.unbonds_new(address, unbondNonces).call();

      const res0 = result?.[0];
      const res1 = result?.[1];

      if (res0 == null || res1 == null) return;

      return {
        amount: new BigNumber(this.web3.utils.fromWei(res0, 'ether')),
        withdrawEpoch: res1,
        unbondNonces: unbondNonces,
      };
    } catch (error) {
      throw this.handleError('GET_UNBOND_ERR', error);
    }
  }

  /** getUnbondNonces returns unbound nonce
   * @param {string} address - user's address
   * @returns {Promise<string>} Promise with unbound nonce number
   */
  public async getUnbondNonces(address: string) {
    try {
      const methods = this.contract_buy.methods;
      if (!methods.unbondNonces) return;

      return await methods.unbondNonces(address).call();
    } catch (error) {
      throw this.handleError('GET_UNBOND_NONCE_ERR', error);
    }
  }

  /** getCurrentEpoch returns current epoch
   * @returns {Promise<string>} Promise with current epoch number
   */
  public async getCurrentEpoch(): Promise<string | undefined> {
    const methods = this.contract_staking.methods;

    if (!methods.currentEpoch) return;

    return await methods.currentEpoch().call();
  }

  private isNumbers(value: unknown): value is Numbers {
    return (
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'string'
    );
  }
}
