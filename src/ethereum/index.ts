import Web3 from 'web3';
import BigNumber from 'bignumber.js';

import type { Contract } from 'web3-eth-contract';
import type { provider } from 'web3-core';
import {
  ABI_CONTRACT_ACCOUNTING,
  ABI_CONTRACT_POOL,
  ETHEREUM_NETWORK_ADDRESSES,
} from './constants';
import type { NetworkType } from './types';

/**
 * The `Ethereum` class provides methods for interacting with the Ethereum network.
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
 *
 * @method constructor(network: NetworkType = "mainnet", url?: provider) - Constructs an instance of the `Ethereum` class.
 * @method selectNetwork(network: NetworkType, url?: provider): Ethereum - Selects and initializes a new network.
 * @method getBalance(): Promise<BigNumber> - Retrieves the balance of the contract.
 */
export default class Ethereum {
  private rpcUrl!: provider;
  private web3!: Web3;
  public addressContractAccounting!: string;
  public addressContractPool!: string;
  public addressContractWithdrawTreasury!: string;
  public contractAccounting!: Contract;
  public contractPool!: Contract;

  constructor(network: NetworkType = 'mainnet', url?: provider) {
    this.initializeNetwork(network, url);
  }

  /**
   * Selects and initializes a new network.
   *
   * This method calls `initializeNetwork` with the provided parameters and returns the current instance,
   * allowing for method chaining.
   *
   * @param network - The network type. This should be one of the keys in `ETHEREUM_NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `ETHEREUM_NETWORK_ADDRESSES`.
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
   * @param network - The network type. This should be one of the keys in `ETHEREUM_NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `ETHEREUM_NETWORK_ADDRESSES`.
   *
   * @throws Will throw an error if the provided network is not supported (i.e., not a key in `ETHEREUM_NETWORK_ADDRESSES`).
   */
  private initializeNetwork(network: NetworkType, url?: provider): void {
    const networkAddresses = ETHEREUM_NETWORK_ADDRESSES[network];

    if (!networkAddresses) throw new Error(`Unsupported network ${network}`);

    this.rpcUrl = url || networkAddresses.rpcUrl;
    this.addressContractAccounting = networkAddresses.addressContractAccounting;
    this.addressContractPool = networkAddresses.addressContractPool;
    this.addressContractWithdrawTreasury =
      networkAddresses.addressContractWithdrawTreasury;

    this.web3 = new Web3(this.rpcUrl);
    this.contractAccounting = new this.web3.eth.Contract(
      ABI_CONTRACT_ACCOUNTING,
      this.addressContractAccounting,
    );
    this.contractPool = new this.web3.eth.Contract(
      ABI_CONTRACT_POOL,
      this.addressContractPool,
    );
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
  public async getBalance(): Promise<BigNumber> {
    try {
      const result = await this.contractAccounting.methods.balance().call();
      return new BigNumber(this.web3.utils.fromWei(result, 'ether'));
    } catch (error) {
      throw new Error(String(error));
    }
  }
}
