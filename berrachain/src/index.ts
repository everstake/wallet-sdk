import { Blockchain } from '../../utils';
import { BoostedQueue, Network, Transaction } from './types';
import Web3 from 'web3';
import { HttpProvider } from 'web3';
import type { Contract } from 'web3';
import { ABI } from './bgt';
import {
  BERA_GAS_RESERVE,
  BERA_TESTNET_BGT_CONTRACT_ADDRESS,
  BERA_TESTNET_VALIDATOR,
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
  private btg!: Contract<typeof ABI>;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(network: Network, rpc: string) {
    super();
    switch (network) {
      case 'testnet':
        this.validator = BERA_TESTNET_VALIDATOR;
        this.btgAddress = BERA_TESTNET_BGT_CONTRACT_ADDRESS;
        break;
      default:
        throw this.throwError('NETWORK_ERROR');
    }
    const httpProvider = new HttpProvider(rpc);
    this.web3 = new Web3(httpProvider);
    this.btg = new this.web3.eth.Contract(ABI, this.btgAddress);
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
      return await this.btg.methods.balanceOf(address).call();
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
  public async boosted(address: string): Promise<string> {
    try {
      return await this.btg.methods.boosted(this.validator, address).call();
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
  public async boosts(address: string): Promise<number> {
    try {
      return await this.btg.methods.boosts(address).call();
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
  public async boostedQueue(address: string): Promise<BoostedQueue> {
    try {
      const result = await this.btg.methods
        .boostedQueue(address, this.validator)
        .call();

      return {
        lastBlock: Number(result[0]),
        balance: result[1].toString(),
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
  public async activateBoost(address: string): Promise<Transaction> {
    try {
      const gasConsumption = await this.btg.methods
        .activateBoost(this.validator)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.methods.activateBoost(this.validator).encodeABI(),
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
  public async cancelBoost(
    address: string,
    amount: string,
  ): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.methods
        .cancelBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.methods
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
   * @param amount - The amount of boost
   * @returns A Promise that resolves to the transaction data
   *
   * @throws Will throw an error if the contract call fails.
   */
  public async dropBoost(
    address: string,
    amount: string,
  ): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.methods
        .dropBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.methods.dropBoost(this.validator, amountWei).encodeABI(),
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
  public async boost(address: string, amount: string): Promise<Transaction> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }

      const amountWei = this.web3.utils.toWei(amount, 'ether');

      const gasConsumption = await this.btg.methods
        .queueBoost(this.validator, amountWei)
        .estimateGas({ from: address });

      return {
        from: address,
        to: this.btgAddress,
        value: 0,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: this.btg.methods
          .queueBoost(this.validator, amountWei)
          .encodeABI(),
      };
    } catch (error) {
      throw this.handleError('BOOST_ERROR', error);
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
    return Number(gasConsumption) + BERA_GAS_RESERVE;
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
