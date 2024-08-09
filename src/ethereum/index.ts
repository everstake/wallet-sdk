import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import type { AbiItem } from 'web3-utils';

import type { Contract } from 'web3-eth-contract';
import type { provider } from 'web3-core';
import {
  ABI_CONTRACT_ACCOUNTING,
  ABI_CONTRACT_POOL,
  NETWORK_ADDRESSES,
  GAS_RESERVE,
  MIN_AMOUNT,
  UINT16_MAX,
} from './constants';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import type { NetworkType, Transaction, ValidatorStatus } from './types';
import { Blockchain } from '../utils';

/**
 * The `Ethereum` class extends the `Blockchain` class and provides methods for interacting with the Ethereum network.
 *
 * It allows you to select a network, initialize it, and retrieve the balance of the contract.
 *
 * @property {provider} rpcUrl - The RPC URL of the Ethereum network.
 * @property {Web3} web3 - The Web3 instance used for interacting with the Ethereum network.
 * @property {string} addressContractAccounting - The address of the accounting contract.
 * @property {string} addressContractPool - The address of the pool contract.
 * @property {string} addressContractWithdrawTreasury - The address of the withdraw treasury contract.
 * @property {Contract} contractAccounting - The accounting contract instance.
 * @property {Contract} contractPool - The pool contract instance.
 * @property ERROR_MESSAGES - The error messages for the Ethereum class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Ethereum class.
 *
 */
export class Ethereum extends Blockchain {
  public addressContractAccounting!: string;
  public addressContractPool!: string;
  public addressContractWithdrawTreasury!: string;
  public contractAccounting!: Contract;
  public contractPool!: Contract;

  private rpcUrl!: provider;
  private web3!: Web3;
  private minAmount = new BigNumber(MIN_AMOUNT);

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(network: NetworkType = 'mainnet', url?: provider) {
    super();
    this.initializeNetwork(network, url);
  }

  /**
   * Retrieves the balance of the contract.
   *
   * This method calls the `balance` method on the `contractAccounting` contract,
   * converts the result from Wei to Ether, and returns the result as a `BigNumber`.
   *
   * @returns A promise that resolves to the balance of the contract as a `BigNumber`.
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async balance(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods.balance().call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('BALANCE_ERROR', error);
    }
  }

  /**
   * Fetches the pool pending balance. This balance is always less than 32 ETH.
   *
   * @returns A Promise that resolves to the pending balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingBalance(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingBalance()
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_BALANCE_ERROR', error);
    }
  }

  /**
   * Fetches the pool pending deposited balance. This is the balance deposited into the Beacon deposit contract but validators are still not active.
   *
   * @returns A Promise that resolves to the pending deposited balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingDepositedBalance(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingDepositedBalance()
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_DEPOSITED_BALANCE_ERROR', error);
    }
  }

  /**
   * Fetches the pool restaked rewards which are in pending status.
   *
   * @returns A Promise that resolves to the pending restaked rewards amount in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingRestakedRewards(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingRestakedRewards()
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_RESTAKED_REWARDS_ERROR', error);
    }
  }

  /**
   * Fetches the pool unclaimed rewards amount which can be restaked.
   *
   * @returns A Promise that resolves to the unclaimed rewards amount in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async readyforAutocompoundRewardsAmount(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .readyforAutocompoundRewardsAmount()
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError(
        'READY_FOR_AUTOCOMPOUND_REWARDS_AMOUNT_ERROR',
        error,
      );
    }
  }

  /**
   * Fetches the pending balance of a given address.
   *
   * @param address - The address to fetch the pending balance for.
   *
   * @returns A Promise that resolves to the pending balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingBalanceOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingBalanceOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_BALANCE_OF_ERROR', error);
    }
  }

  /**
   * Fetches the user's pending deposited balance. This is the balance deposited into the validator but not active yet.
   * Pending deposited balance can't be unstaked till validator activation.
   *
   * @param address - The address to fetch the pending deposited balance for.
   *
   * @returns A Promise that resolves to the pending deposited balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingDepositedBalanceOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingDepositedBalanceOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_DEPOSITED_BALANCE_OF_ERROR', error);
    }
  }

  /**
   * Fetches the user's active origin deposited balance.
   *
   * @param address - The address to fetch the deposited balance for.
   *
   * @returns A Promise that resolves to the deposited balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async depositedBalanceOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .depositedBalanceOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('DEPOSITED_BALANCE_OF_ERROR', error);
    }
  }

  /**
   * Fetches the user's restaked rewards in pending state.
   *
   * @param address - The address to fetch the pending restaked rewards for.
   *
   * @returns A Promise that resolves to the pending restaked rewards in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async pendingRestakedRewardOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .pendingRestakedRewardOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('PENDING_RESTAKED_REWARD_OF_ERROR', error);
    }
  }

  /**
   * Returns total user restaked rewards. Includes rewards in pending state.
   *
   * @param address - The address to fetch the restaked rewards for.
   *
   * @returns A Promise that resolves to the restaked rewards in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async restakedRewardOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .restakedRewardOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('RESTAKED_REWARD_OF_ERROR', error);
    }
  }

  /**
   * Fetches the pool fee in bips (1/10000).
   *
   * @returns A Promise that resolves to the pool fee.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async getPoolFee(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods.getPoolFee().call();

      return new BigNumber(result).div(10000);
    } catch (error) {
      throw this.handleError('GET_POOL_FEE_ERROR', error);
    }
  }

  /**
   * Claims all pool rewards and restakes it into the pool.
   *
   * @param address - The address to perform the autocompound operation for.
   *
   * @returns A Promise that resolves to a transaction object.
   *
   * @throws Will throw an Error if the contract call fails or there are no rewards.
   */
  public async autocompound(address: string): Promise<Transaction> {
    try {
      const rewards = await this.readyforAutocompoundRewardsAmount();
      const gasConsumption = await this.contractAccounting.methods
        .autocompound()
        .estimateGas({ from: address });
      if (rewards.isZero()) this.throwError('NO_REWARDS_MESSAGE');

      return {
        from: address,
        to: this.addressContractAccounting,
        value: 0,
        gasLimit: gasConsumption + GAS_RESERVE,
        data: this.contractAccounting.methods.autocompound().encodeABI(),
      };
    } catch (error) {
      throw this.handleError('AUTOCOMPOUND_ERROR', error);
    }
  }

  /**
   * Returns total user autocompound balance. Part of this balance could be in pending state after rewards autocompound.
   *
   * @param address - The address to fetch the autocompound balance for.
   *
   * @returns A Promise that resolves to the autocompound balance in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async autocompoundBalanceOf(address: string): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods
        .autocompoundBalanceOf(address)
        .call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('AUTOCOMPOUND_BALANCE_OF_ERROR', error);
    }
  }

  /**
   * Returns info about withdraw requests queue.
   * Includes totally all-time requested withdraw amount,
   * actual allowed for interchange with deposits amount,
   * all-time withdraw treasury filled amount,
   * and all-time claimed by users amount.
   *
   * @returns A Promise that resolves to an object containing the withdraw request queue parameters.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async withdrawRequestQueueParams(): Promise<{
    withdrawRequested: BigNumber;
    interchangeAllowed: BigNumber;
    filled: BigNumber;
    claimed: BigNumber;
  }> {
    try {
      const result = await this.contractAccounting.methods
        .withdrawRequestQueueParams()
        .call();

      return {
        // Totally all-time requested withdraw amount.
        withdrawRequested: this.fromWeiToEther(result[0]),
        // Actual allowed for interchange with deposits amount.
        interchangeAllowed: this.fromWeiToEther(result[1]),
        // All-time withdraw treasury filled amount.
        filled: this.fromWeiToEther(result[2]),
        // All-time claimed by users amount
        claimed: this.fromWeiToEther(result[3]),
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_REQUEST_QUEUE_PARAMS_ERROR', error);
    }
  }

  /**
   * Returns user withdraw request info. Includes the actual requested amount and the amount ready for claim.
   *
   * @param address - The address to fetch the withdraw request info for.
   *
   * @returns A Promise that resolves to an object containing the requested amount and the amount ready for claim in ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async withdrawRequest(
    address: string,
  ): Promise<{ requested: BigNumber; readyForClaim: BigNumber }> {
    try {
      const result = await this.contractAccounting.methods
        .withdrawRequest(address)
        .call();

      return {
        requested: this.fromWeiToEther(result[0]),
        readyForClaim: this.fromWeiToEther(result[1]),
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_REQUEST_ERROR', error);
    }
  }

  /**
   * Claims funds requested by withdraw.
   *
   * @param address - The address to perform the claim operation for.
   *
   * @returns A Promise that resolves to a transaction object.
   *
   * @throws Will throw an Error if the contract call fails, there are no funds to claim, or the claim is not yet filled.
   */
  public async claimWithdrawRequest(address: string): Promise<Transaction> {
    try {
      const rewards = await this.withdrawRequest(address);

      if (rewards.requested.isZero()) {
        this.throwError('ZERO_UNSTAKE_ERROR');
      }

      if (!rewards.readyForClaim.eq(rewards.requested)) {
        this.throwError('NOT_FILLED_UNSTAKE_MESSAGE');
      }

      const gasConsumption = await this.contractAccounting.methods
        .claimWithdrawRequest()
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.addressContractAccounting,
        value: 0,
        gasLimit: gasConsumption + GAS_RESERVE,
        data: this.contractAccounting.methods
          .claimWithdrawRequest()
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('CLAIM_WITHDRAW_REQUEST_ERROR', error);
    }
  }

  /**
   * Returns the number of validators expected to stop.
   *
   * @returns A Promise that resolves to the number of validators expected to stop.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async closeValidatorsStat(): Promise<number> {
    try {
      const result = await this.contractAccounting.methods
        .closeValidatorsStat()
        .call();

      return Number(result);
    } catch (error) {
      throw this.handleError('CLOSE_VALIDATORS_STAT_ERROR', error);
    }
  }

  /**
   * Stakes funds into pool.
   *
   * @param address - Sender address.
   * @param amount - Stake amount in ETH.
   * @param source - Stake source. Default is '0'.
   *
   * @returns A Promise that resolves to the unsigned ETH transaction object.
   *
   * @throws Will throw an Error if the amount is not a string, the amount is less than the minimum, or the contract call fails.
   */

  public async stake(
    address: string,
    amount: string,
    source: string = '0',
  ): Promise<Transaction> {
    if (typeof amount !== 'string') {
      this.throwError('WRONG_TYPE_MESSAGE');
    }

    const amountWei = this.web3.utils.toWei(amount, 'ether');

    if (new BigNumber(amountWei).lt(this.minAmount)) {
      this.throwError('MIN_AMOUNT_ERROR', this.minAmount.toString());
    }

    try {
      const gasConsumption = await this.contractPool.methods
        .stake(source)
        .estimateGas({ from: address, value: amountWei });

      // Create the transaction
      return {
        from: address,
        to: this.addressContractPool,
        value: Number(amountWei),
        gasLimit: gasConsumption + GAS_RESERVE,
        data: this.contractPool.methods.stake(source).encodeABI(),
      };
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }

  /**
   * Unstake value from active autocompound balance.
   * AllowedInterchangeNum is max allowed number interchanges with pending stakers.
   * Unstaked immediately if value <= pool pending balance or create withdraw request.
   * Interchange disallowed as default.
   *
   * @param address - Sender address.
   * @param amount - Unstake amount in ETH.
   * @param allowedInterchangeNum - Max allowed number of interchanges. Default is 0.
   * @param source - Unstake source. Default is '0'.
   *
   * @returns A Promise that resolves to the unsigned ETH transaction object.
   *
   * @throws Will throw an Error if the amount is not a string, the balance is less than the amount, or the contract call fails.
   */
  public async unstake(
    address: string,
    amount: string,
    allowedInterchangeNum: number = 0,
    source: string = '0',
  ): Promise<Transaction> {
    if (typeof amount !== 'string') {
      this.throwError('WRONG_TYPE_MESSAGE');
    }

    try {
      const balance = await this.autocompoundBalanceOf(address);
      // Check for type overflow
      if (allowedInterchangeNum > UINT16_MAX) {
        allowedInterchangeNum = UINT16_MAX;
      }

      if (balance.lt(new BigNumber(amount))) {
        this.throwError('MAX_AMOUNT_FOR_UNSTAKE_ERROR', balance.toString());
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');
      const gasConsumption = await this.contractPool.methods
        .unstake(amountWei, allowedInterchangeNum, source)
        .estimateGas({ from: address });

      // Create the transaction
      return {
        from: address,
        value: 0,
        to: this.addressContractPool,
        gasLimit: gasConsumption + GAS_RESERVE,
        data: this.contractPool.methods
          .unstake(amountWei, allowedInterchangeNum, source)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  /**
   * Simulate unstake transaction and return amount of instant unstake.
   * Required to compare evaluation of allowedInterchangeNum parameter.
   *
   * @param address - Sender address.
   * @param amount - Unstake amount in ETH.
   * @param allowedInterchangeNum - Max allowed number of interchanges. Default is 1.
   * @param source - Unstake source. Default is '0'.
   *
   * @returns A Promise that resolves to a BigNumber representing the instant unstake amount in ETH.
   *
   * @throws Will throw an Error if the balance is less than the amount or the contract call fails.
   */
  public async simulateUnstake(
    address: string,
    amount: string,
    allowedInterchangeNum: number = 1,
    source: string = '0',
  ): Promise<BigNumber> {
    try {
      const balance = await this.autocompoundBalanceOf(address);
      // Check for type overflow
      if (allowedInterchangeNum > UINT16_MAX) {
        allowedInterchangeNum = UINT16_MAX;
      }
      // Balance greater than or equal to amount
      if (balance.lt(new BigNumber(amount))) {
        this.throwError('MAX_AMOUNT_FOR_UNSTAKE_ERROR', balance.toString());
      }
      const amountWei = this.web3.utils.toWei(amount, 'ether');
      const result = await this.contractPool.methods
        .unstake(amountWei, allowedInterchangeNum, source)
        .call({ from: address });

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('SIMULATE_UNSTAKE_ERROR', error);
    }
  }

  /**
   * Unstakes the pending amount from Autocompound.
   *
   * @param address - The address from which the amount will be unstaked.
   * @param amount - The amount to unstake.
   *
   * @returns A Promise that resolves to a transaction object.
   *
   * @throws Will throw an Error if the pending balance is zero, the amount is greater than the pending balance,
   * or the pending balance is less than the minimum stake amount.
   */

  public async unstakePending(
    address: string,
    amount: number,
  ): Promise<Transaction> {
    let pendingBalance = await this.pendingBalanceOf(address);
    if (pendingBalance.isZero()) {
      this.throwError('ZERO_UNSTAKE_MESSAGE');
    }

    const bnAmount = new BigNumber(amount);
    if (bnAmount.gt(pendingBalance)) {
      this.throwError(
        'AMOUNT_GREATER_THAN_PENDING_BALANCE_ERROR',
        pendingBalance.toString(),
      );
    }

    try {
      pendingBalance = pendingBalance.minus(bnAmount);
      if (!pendingBalance.isZero()) {
        const minStake = await this.minStakeAmount();
        if (pendingBalance.lt(minStake)) {
          this.throwError(
            'INSUFFICIENT_PENDING_BALANCE_ERROR',
            minStake.toString(),
          );
        }
      }

      const amountWei = this.web3.utils.toWei(amount.toString(), 'ether');
      const gasConsumption = await this.contractPool.methods
        .unstakePending(amountWei)
        .estimateGas({ from: address });

      // Create the transaction
      return {
        from: address,
        value: 0,
        to: this.addressContractPool,
        gasLimit: gasConsumption + GAS_RESERVE,
        data: this.contractPool.methods.unstakePending(amountWei).encodeABI(),
      };
    } catch (error) {
      throw this.handleError('UNSTAKE_PENDING_ERROR', error);
    }
  }

  /**
   * Activates pending stake by interchange with withdraw request.
   *
   * @param address - The address from which the stake will be activated.
   *
   * @returns A Promise that resolves to a transaction object.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async activateStake(address: string): Promise<Transaction> {
    try {
      const gasAmount = await this.contractPool.methods
        .activateStake()
        .estimateGas({ from: address });

      // Create the transaction
      return {
        from: address,
        to: this.addressContractPool,
        value: 0,
        gasLimit: gasAmount + GAS_RESERVE,
        data: this.contractPool.methods.activateStake().encodeABI(),
      };
    } catch (error) {
      throw this.handleError('ACTIVATE_STAKE_ERROR', error);
    }
  }

  /**
   * Fetches the number of validators prepared for deposit from the contract pool.
   *
   * @returns A Promise that resolves to the number of validators prepared for deposit.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async getPendingValidatorCount(): Promise<number> {
    try {
      const result = await this.contractPool.methods
        .getPendingValidatorCount()
        .call();

      return Number(result);
    } catch (error) {
      throw this.handleError('GET_PENDING_VALIDATOR_COUNT_ERROR', error);
    }
  }

  /**
   * Fetches a pending validator's public key by index from the contract pool.
   * Note: The list of pending validators is dynamic so ordering is unstable.
   *
   * @param index - The index of the pending validator to fetch.
   *
   * @returns A Promise that resolves to the public key of the pending validator.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async getPendingValidator(index: number): Promise<string> {
    try {
      const result = await this.contractPool.methods
        .getPendingValidator(index)
        .call();

      return result;
    } catch (error) {
      throw this.handleError('GET_PENDING_VALIDATOR_ERROR', error);
    }
  }

  /**
   * Fetches the total number of known validators from the contract pool.
   * A validator can be in one of the following statuses: pending, deposited, exited.
   * Exited validators will be overwritten by new pending validators to optimize memory usage.
   *
   * @returns A Promise that resolves to the total number of known validators.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async getValidatorCount(): Promise<number> {
    try {
      const result = await this.contractPool.methods.getValidatorCount().call();

      return Number(result);
    } catch (error) {
      throw this.handleError('GET_VALIDATOR_COUNT_ERROR', error);
    }
  }

  /**
   * Fetches a validator from the contract pool by its index.
   * The result is an object containing the validator's public key and status.
   *
   * @param index - The index of the validator to fetch.
   *
   * @returns A Promise that resolves to an object with the validator's public key and status.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async getValidator(
    index: number,
  ): Promise<{ pubkey: string; status: string }> {
    try {
      const result = await this.contractPool.methods.getValidator(index).call();

      return {
        pubkey: result[0],
        status: this.getStatusFromCode(result[1]),
      };
    } catch (error) {
      throw this.handleError('GET_VALIDATOR_ERROR', error);
    }
  }

  /**
   * Fetches the minimum stake amount from the contract pool.
   * The result is converted from Wei to Ether using Web3 utilities.
   *
   * @returns A Promise that resolves to a BigNumber representing the minimum stake amount in Ether.
   *
   * @throws Will throw an Error if the contract call fails.
   */
  public async minStakeAmount(): Promise<BigNumber> {
    try {
      const result = await this.contractPool.methods.minStakeAmount().call();

      return this.fromWeiToEther(result);
    } catch (error) {
      throw this.handleError('MIN_STAKE_AMOUNT_ERROR', error);
    }
  }

  /**
   * Selects and initializes a new network.
   *
   * This method calls `initializeNetwork` with the provided parameters and returns the current instance,
   * allowing for method chaining.
   *
   * @param network - The network type. This should be one of the keys in `NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `NETWORK_ADDRESSES`.
   *
   * @returns The current instance of the `Ethereum` class.
   */
  public selectNetwork(network: NetworkType, url?: provider): Ethereum {
    this.initializeNetwork(network, url);

    return this;
  }

  /**
   * Initializes the network.
   *
   * This method sets the RPC URL, contract addresses, and initializes the Web3 instance and contracts.
   *
   * @param network - The network type. This should be one of the keys in `NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `NETWORK_ADDRESSES`.
   *
   * @throws Will throw an error if the provided network is not supported (i.e., not a key in `NETWORK_ADDRESSES`).
   */
  private initializeNetwork(network: NetworkType, url?: provider): void {
    const networkAddresses = NETWORK_ADDRESSES[network];

    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }

    this.rpcUrl = url || networkAddresses.rpcUrl;
    this.addressContractAccounting = networkAddresses.addressContractAccounting;
    this.addressContractPool = networkAddresses.addressContractPool;
    this.addressContractWithdrawTreasury =
      networkAddresses.addressContractWithdrawTreasury;

    this.web3 = new Web3(this.rpcUrl);

    // TODO: Avoid using casting to AbiItem[].
    this.contractAccounting = new this.web3.eth.Contract(
      ABI_CONTRACT_ACCOUNTING as AbiItem[],
      this.addressContractAccounting,
    );
    this.contractPool = new this.web3.eth.Contract(
      ABI_CONTRACT_POOL as AbiItem[],
      this.addressContractPool,
    );
  }

  /**
   * Converts a status code into a human-readable status.
   *
   * @param code - The status code to convert. '0' means 'unknown', '1' means 'pending', any other value means 'deposited'.
   *
   * @returns The human-readable status corresponding to the given code.
   */
  private getStatusFromCode(code: string): ValidatorStatus {
    switch (code) {
      case '0':
        return 'unknown';
      case '1':
        return 'pending';
      default:
        return 'deposited';
    }
  }

  /**
   * Converts the given amount from Wei to Ether.
   *
   * @param amount - The amount in Wei to convert to Ether.
   *
   * @returns The converted amount in Ether as a BigNumber.
   */
  private fromWeiToEther(amount: string): BigNumber {
    return new BigNumber(this.web3.utils.fromWei(amount, 'ether'));
  }
}