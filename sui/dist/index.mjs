// src/index.ts
import { SuiClient } from "@mysten/sui/client";

// src/utils/constants/errors.ts
var COMMON_ERROR_MESSAGES = {
  UNKNOWN_ERROR: "An unknown error occurred",
  TOKEN_ERROR: "Please create or use correct token"
};

// src/utils/index.ts
var WalletSDKError = class extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var Blockchain = class {
  /**
   * Handles errors that occur within the Ethereum class.
   *
   * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
   * @param {Error | WalletSDKError | unknown} originalError - The original error that was thrown.
   *
   * If the original error is an instance of WalletSDKError, it is thrown as is.
   * If the original error is an instance of the built-in Error class, a new WalletSDKError is thrown with the original error as the cause.
   * If the original error is not an instance of WalletSDKError or Error, a new WalletSDKError is thrown with a generic message and code.
   */
  handleError(code, originalError) {
    const message = this.ERROR_MESSAGES[code];
    if (originalError instanceof WalletSDKError || !message || !code) {
      throw originalError;
    }
    if (originalError instanceof Error) {
      const newMessage = Object.entries(this.ORIGINAL_ERROR_MESSAGES).find(
        ([originalMessage]) => originalError.message.includes(originalMessage)
      )?.[1];
      const errorMessage = newMessage || this.ERROR_MESSAGES[code] || COMMON_ERROR_MESSAGES["UNKNOWN_ERROR"];
      throw new WalletSDKError(errorMessage, String(code), originalError);
    }
    throw new WalletSDKError(
      COMMON_ERROR_MESSAGES["UNKNOWN_ERROR"],
      "UNKNOWN_ERROR"
    );
  }
  /**
   * Throws a WalletSDKError with a specified error code and message.
   *
   * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
   * @param {...string[]} values - The values to be inserted into the error message.
   *
   * The method retrieves the error message template associated with the provided code from the ERROR_MESSAGES object.
   * It then replaces placeholders in the message template with provided values and throws a WalletSDKError with the final message and the provided code.
   */
  throwError(code, ...values) {
    let message = this.ERROR_MESSAGES[code];
    values.forEach((value, index) => {
      message = message?.replace(`{${index}}`, value);
    });
    if (!message) {
      throw new WalletSDKError(
        COMMON_ERROR_MESSAGES["UNKNOWN_ERROR"],
        "UNKNOWN_ERROR"
      );
    }
    throw new WalletSDKError(message, String(code));
  }
  /**
   * Check if the URL is valid
   *
   * @param {string} url - URL
   * @returns a bool type result.
   *
   */
  isValidURL(url) {
    let urlClass;
    try {
      urlClass = new URL(url);
    } catch (_) {
      return false;
    }
    return urlClass.protocol === "http:" || urlClass.protocol === "https:";
  }
};

// src/constants/index.ts
import BigNumber from "bignumber.js";
var SUI_NETWORK_ADDRESSES = {
  mainnet: {
    validatorAddress: "0xbba318294a51ddeafa50c335c8e77202170e1f272599a2edc40592100863f638",
    rpcUrl: "https://sui-mainnet-endpoint.blockvision.org"
  },
  testnet: {
    validatorAddress: "0x155d5e5f1904db5f3a16924d0211b4c34cfcc947f345a1deff1452fc5373fed4",
    rpcUrl: "https://fullnode.testnet.sui.io:443"
  }
};
var SUI_BASE_NUM = new BigNumber(1e9);
var SUI_MIN_AMOUNT_FOR_STAKE = 1;

// src/constants/error.ts
var ERROR_MESSAGES = {
  ADDRESS_FORMAT_ERROR: "Invalid Sui address format",
  STAKE_BALANCE_ERROR: "Error getting stake balance",
  MIN_STAKE_AMOUNT_ERROR: "Amount is less than minimum stake amount",
  STAKE_ERROR: "Error staking",
  USER_BALANCES_ERROR: "Error getting user balances",
  UNSTAKE_ERROR: "Error unstaking",
  NETWORK_NOT_SUPPORTED: "Unsupported network"
};
var ORIGINAL_ERROR_MESSAGES = {};

// src/index.ts
import BigNumber2 from "bignumber.js";
import {
  isValidSuiAddress,
  SUI_SYSTEM_STATE_OBJECT_ID
} from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
var Sui = class extends Blockchain {
  ERROR_MESSAGES = ERROR_MESSAGES;
  ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;
  validatorAddress;
  client;
  constructor(network = "mainnet", url) {
    super();
    this.initializeNetwork(network, url);
  }
  /**
   * Selects and initializes a new network.
   *
   * This method calls `initializeNetwork` with the provided parameters and returns the current instance,
   * allowing for method chaining.
   *
   * @param network - The network type. This should be one of the keys in `SUI_NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `SUI_NETWORK_ADDRESSES`.
   *
   * @returns The current instance of the `Sui` class.
   */
  selectNetwork(network, url) {
    this.initializeNetwork(network, url);
    return this;
  }
  /**
   * Initializes the network.
   *
   * This method sets the validator address and initializes the SuiClient with the appropriate RPC URL.
   *
   * @param network - The network type. This should be one of the keys in `SUI_NETWORK_ADDRESSES`.
   * @param url - The RPC URL of the network. If not provided, the method will use the URL from `SUI_NETWORK_ADDRESSES`.
   *
   * @throws Will throw an error if the provided network is not supported (i.e., not a key in `SUI_NETWORK_ADDRESSES`).
   */
  initializeNetwork(network, url) {
    const networkAddresses = SUI_NETWORK_ADDRESSES[network];
    if (!networkAddresses) {
      this.throwError("NETWORK_NOT_SUPPORTED", network);
    }
    this.validatorAddress = networkAddresses.validatorAddress;
    this.client = new SuiClient({
      url: url ?? networkAddresses.rpcUrl
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
  async getStakeBalanceByAddress(address) {
    if (!this.isAddress(address)) {
      this.throwError("ADDRESS_FORMAT_ERROR");
    }
    try {
      const delegatedStakes = await this.client.getStakes({ owner: address });
      return delegatedStakes;
    } catch (error) {
      throw this.handleError("STAKE_BALANCE_ERROR", error);
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
  async getBalanceByAddress(address) {
    if (!this.isAddress(address)) {
      this.throwError("ADDRESS_FORMAT_ERROR");
    }
    try {
      const balance = await this.client.getBalance({ owner: address });
      return new BigNumber2(balance.totalBalance);
    } catch (error) {
      throw this.handleError("USER_BALANCES_ERROR", error);
    }
  }
  /**
   * Creates a transaction to transfer SUI tokens to a recipient.
   *
   * @param recipientAddress - The address of the recipient.
   * @param amount - The amount of SUI tokens to transfer as a string.
   *
   * @returns A promise that resolves to a Transaction object ready to be signed and executed.
   *
   * @throws Will throw an error if the recipient address is not valid or if the transaction preparation fails.
   */
  async sendTransfer(recipientAddress, amount) {
    if (!this.isAddress(recipientAddress)) {
      this.throwError("ADDRESS_FORMAT_ERROR");
    }
    try {
      const tx = new Transaction();
      const coin = tx.splitCoins(tx.gas, [
        SUI_BASE_NUM.multipliedBy(amount).toString()
      ]);
      tx.transferObjects([coin], recipientAddress);
      return tx;
    } catch (error) {
      throw this.handleError("TRANSFER_ERROR", error);
    }
  }
  /**
   * Creates a transaction to stake SUI tokens with a validator.
   *
   * @param amount - The amount of SUI tokens to stake as a string.
   *
   * @returns A promise that resolves to a Transaction object ready to be signed and executed.
   *
   * @throws Will throw an error if the amount is less than the minimum required for staking
   * or if the transaction preparation fails.
   */
  async stake(amount) {
    if (+amount < SUI_MIN_AMOUNT_FOR_STAKE) {
      this.throwError("MIN_STAKE_AMOUNT_ERROR");
    }
    try {
      const tx = new Transaction();
      const stakeCoin = tx.splitCoins(tx.gas, [
        SUI_BASE_NUM.multipliedBy(amount).toString()
      ]);
      tx.moveCall({
        target: "0x3::sui_system::request_add_stake",
        arguments: [
          tx.sharedObjectRef({
            objectId: SUI_SYSTEM_STATE_OBJECT_ID,
            initialSharedVersion: 1,
            mutable: true
          }),
          stakeCoin,
          tx.pure.address(this.validatorAddress)
        ]
      });
      return tx;
    } catch (error) {
      throw this.handleError("STAKE_ERROR", error);
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
  async unstake(stakedSuiId) {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: "0x3::sui_system::request_withdraw_stake",
        arguments: [
          tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
          tx.object(stakedSuiId)
        ]
      });
      return tx;
    } catch (error) {
      throw this.handleError("UNSTAKE_ERROR", error);
    }
  }
  /**
   * Validates if a string is a valid Sui address.
   *
   * @param address - The string to validate as a Sui address.
   *
   * @returns A boolean indicating whether the string is a valid Sui address.
   */
  isAddress(address) {
    return isValidSuiAddress(address);
  }
};
export {
  Sui
};
