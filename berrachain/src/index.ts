/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Blockchain } from '../../utils';
import { BGTContract, BoostedQueue, Network, Transaction } from './types';
import Web3, { HttpProvider } from 'web3';
import { MAINNET_ABI } from './bgt_mainnet';
import { TESTNET_ABI } from './bgt_testnet';
import {
  GAS_RESERVE,
  MAINNET_BGT_CONTRACT_ADDRESS,
  MAINNET_VALIDATOR,
  TESTNET_BGT_CONTRACT_ADDRESS,
  TESTNET_VALIDATOR,
} from './constants';

import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';

/**
 * The `Berrachain` class extends the `Blockchain` class and provides methods for interacting with the Berrachain network.
 *
 * It allows you to select a network, initialize it, and retrieve the balance of the contract.
 *
 * @property {string} validator - The address of the validator.
 * @property {Web3} web3 - The Web3 instance used for interacting with the Ethereum network.
 * @property {string} btgAddress - The address of the BTG contract.
 * @property {Contract} btg - The BTG contract instance.
 * @property ERROR_MESSAGES - The error messages for the Berrachain class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Berrachain class.
 *
 */
export class Berrachain extends Blockchain {
  private validator: string;
  private web3!: Web3;
  private readonly btgAddress: string;
  private btg: BGTContract;
  private readonly network: Network;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(network: Network = 'mainnet', rpc: string) {
    super();
    const httpProvider = new HttpProvider(rpc);
    this.web3 = new Web3(httpProvider);
    this.network = network;
    switch (network) {
      case 'mainnet':
        this.validator = MAINNET_VALIDATOR;
        this.btgAddress = MAINNET_BGT_CONTRACT_ADDRESS;
        this.btg = {
          network: network,
          contract: new this.web3.eth.Contract(
            MAINNET_ABI,
            MAINNET_BGT_CONTRACT_ADDRESS,
          ),
        };
        break;
      case 'testnet':
        this.validator = TESTNET_VALIDATOR;
        this.btgAddress = TESTNET_BGT_CONTRACT_ADDRESS;
        this.btg = {
          network: network,
          contract: new this.web3.eth.Contract(
            TESTNET_ABI,
            TESTNET_BGT_CONTRACT_ADDRESS,
          ),
        };
        break;
      default:
        throw this.throwError('NETWORK_ERROR');
    }
  }

  /**
   * Retrieves the balance of the user by address
   *
   * @param address - The staker address
   * @returns A Promise that resolves to the balance.
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async balanceOf(address: string): Promise<string> {
    try {
      return await this.btg.contract.methods.balanceOf(address).call();
    } catch (error) {
      throw this.handleError('BALANCE_ERROR', error);
    }
  }

  /**
   * Retrieves the boosted stake of the user by address
   *
   * @param address - The staker address
   * @returns A Promise that resolves to the boosted stake.
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async getStake(address: string): Promise<string> {
    try {
      return await this.btg.contract.methods
        .boosted(address, this.validator)
        .call();
    } catch (error) {
      throw this.handleError('BOOSTED_ERROR', error);
    }
  }

  /**
   * Retrieves all uses boosts by address
   *
   * @param address - The staker address
   * @returns A Promise that resolves to the ball user's boosts.
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async getStakes(address: string): Promise<number> {
    try {
      return await this.btg.contract.methods.boosts(address).call();
    } catch (error) {
      throw this.handleError('BOOSTS_ERROR', error);
    }
  }

  /**
   * Retrieves info about user's boost queue by address
   *
   * @param address - The staker address
   * @returns A Promise that resolves to the balance in queue.
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async getStakeInQueue(address: string): Promise<BoostedQueue> {
    try {
      const result: string[] = await this.btg.contract.methods
        .boostedQueue(address, this.validator)
        .call();

      return {
        lastBlock: Number(result[0]),
        balance: result[1] ? result[1].toString() : '0',
      };
    } catch (error) {
      throw this.handleError('BOOST_QUEUE_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for boost activation
   *
   * @param address - The staker address
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async activateStake(address: string): Promise<Transaction> {
    try {
      let gasConsumption;
      let data;
      switch (this.btg.network) {
        case 'testnet':
          gasConsumption = await this.btg.contract.methods
            .activateBoost(this.validator)
            .estimateGas({ from: address });
          data = this.btg.contract.methods
            .activateBoost(this.validator)
            .encodeABI();
          break;
        case 'mainnet':
          gasConsumption = await this.btg.contract.methods
            .activateBoost(address, this.validator)
            .estimateGas({ from: address });
          data = this.btg.contract.methods
            .activateBoost(address, this.validator)
            .encodeABI();
          break;
      }

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: data,
      };
    } catch (error) {
      throw this.handleError('ACTIVATE_BOOST_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for canceling boost queue
   *
   * @param address - The staker address
   * @param amount - The amount of boost
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async cancelStakeInQueue(
    address: string,
    amount: string,
  ): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.contract.methods
        .cancelBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.contract.methods
          .cancelBoost(this.validator, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('CANCEL_BOOST_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for drop boost (unstake)
   *
   * @param address - The staker address
   * @param amount - The amount of boost (doesn't use for mainnet)
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async unstake(address: string, amount: string): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      let gasConsumption;
      let data;
      switch (this.btg.network) {
        case 'testnet':
          gasConsumption = await this.btg.contract.methods
            .dropBoost(this.validator, amountWei)
            .estimateGas({ from: address });
          data = this.btg.contract.methods
            .dropBoost(this.validator, amountWei)
            .encodeABI();
          break;
        case 'mainnet':
          gasConsumption = await this.btg.contract.methods
            .dropBoost(address, this.validator)
            .estimateGas({ from: address });
          data = this.btg.contract.methods
            .dropBoost(address, this.validator)
            .encodeABI();
          break;
      }

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: data,
      };
    } catch (error) {
      throw this.handleError('DROP_BOOST_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for boost (staking)
   *
   * @param address - The staker address
   * @param amount - The amount of boost
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async stake(address: string, amount: string): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.contract.methods
        .queueBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.contract.methods
          .queueBoost(this.validator, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('BOOST_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for queue drop boost (unstake queue)
   *
   * @param address - The staker address
   * @param amount - The amount of boost
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async queueUnstake(
    address: string,
    amount: string,
  ): Promise<Transaction> {
    try {
      if (this.network !== 'mainnet') {
        this.throwError('NOT_AVAILABLE_NETWORK');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.contract.methods
        .queueDropBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.contract.methods
          .queueDropBoost(this.validator, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('QUEUE_DROP_BOOST_ERROR', error);
    }
  }

  /**
   * Creates a transaction data for cancel drop boost (cancel unstake queue)
   *
   * @param address - The staker address
   * @param amount - The amount of boost
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async cancelUnstake(
    address: string,
    amount: string,
  ): Promise<Transaction> {
    try {
      if (this.network !== 'mainnet') {
        this.throwError('NOT_AVAILABLE_NETWORK');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.contract.methods
        .cancelDropBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.contract.methods
          .cancelDropBoost(this.validator, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('CANCEL_DROP_BOOST_ERROR', error);
    }
  }

  /**
   * Calculates the gas limit by adding a predefined BERA_GAS_RESERVE to the given gas consumption.
   *
   * @param gasConsumption - The amount of gas consumed.
   *
   * @returns The calculated gas limit as a number.
   */
  private calculateGasLimit(gasConsumption: bigint): number {
    return Number(gasConsumption) + GAS_RESERVE;
  }

  /**
   * Checks if a given address has the basic requirements of an Berrachain address format.
   *
   * @param address - The Berrachain address to validate.
   *
   * @returns `true` if the address meets basic requirements, otherwise `false`.
   */
  private isAddress(address: string): boolean {
    return /^(0x)?([0-9a-f]{40})$/.test(address.toLowerCase());
  }
}
