import { SuiClient, DelegatedStake } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */
/**
 * `WalletSDKError` is a custom error class that extends the built-in `Error` class.
 * It provides additional properties for error handling within the Wallet SDK.
 *
 * @remarks
 * This class is needed to provide additional context for errors, such as a code
 * and the original error, if any.
 *
 * @public
 *
 * @param message - The error message.
 * @param code - A string representing the error code.
 * @param originalError - The original error that caused this error, if any.
 */
declare class WalletSDKError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * `Blockchain` is an abstract class that provides a structure for blockchain-specific classes.
 * It includes methods for error handling and throwing errors.
 *
 * @remarks
 * This class should be extended by classes that implement blockchain-specific functionality.
 * The extending classes should provide their own `ERROR_MESSAGES` and `ORIGINAL_ERROR_MESSAGES`.
 *
 * @property ERROR_MESSAGES - An object that maps error codes to error messages.
 * @property ORIGINAL_ERROR_MESSAGES - An object that maps original error messages to user-friendly error messages.
 *
 *
 * **/
declare abstract class Blockchain {
    protected abstract ERROR_MESSAGES: {
        [key: string]: string;
    };
    protected abstract ORIGINAL_ERROR_MESSAGES: {
        [key: string]: string;
    };
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
    handleError(code: keyof typeof this.ERROR_MESSAGES, originalError: Error | WalletSDKError | unknown): void;
    /**
     * Throws a WalletSDKError with a specified error code and message.
     *
     * @param {keyof typeof ERROR_MESSAGES} code - The error code associated with the error.
     * @param {...string[]} values - The values to be inserted into the error message.
     *
     * The method retrieves the error message template associated with the provided code from the ERROR_MESSAGES object.
     * It then replaces placeholders in the message template with provided values and throws a WalletSDKError with the final message and the provided code.
     */
    throwError(code: keyof typeof this.ERROR_MESSAGES, ...values: string[]): void;
    /**
     * Check if the URL is valid
     *
     * @param {string} url - URL
     * @returns a bool type result.
     *
     */
    isValidURL(url: string): boolean;
}

/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */
type SuiNetworkType = 'mainnet' | 'testnet';

/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

declare class Sui extends Blockchain {
    protected ERROR_MESSAGES: {
        ADDRESS_FORMAT_ERROR: string;
        STAKE_BALANCE_ERROR: string;
        MIN_STAKE_AMOUNT_ERROR: string;
        STAKE_ERROR: string;
        USER_BALANCES_ERROR: string;
        UNSTAKE_ERROR: string;
        NETWORK_NOT_SUPPORTED: string;
    };
    protected ORIGINAL_ERROR_MESSAGES: {};
    validatorAddress: string;
    client: SuiClient;
    constructor(network?: SuiNetworkType, url?: string);
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
    selectNetwork(network: SuiNetworkType, url?: string): Sui;
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
    private initializeNetwork;
    /**
     * Retrieves the delegated stakes for a given address.
     *
     * @param address - The address to fetch staking balances for.
     *
     * @returns A promise that resolves to an array of DelegatedStake objects.
     *
     * @throws Will throw an error if the address is not valid or if the API call fails.
     */
    getStakeBalanceByAddress(address: string): Promise<DelegatedStake[]>;
    /**
     * Retrieves the Sui balance for a given address.
     *
     * @param address - The address to fetch the balance for.
     *
     * @returns A promise that resolves to a BigNumber representing the balance.
     *
     * @throws Will throw an error if the address is not valid or if the API call fails.
     */
    getBalanceByAddress(address: string): Promise<BigNumber>;
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
    sendTransfer(recipientAddress: string, amount: string): Promise<Transaction>;
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
    stake(amount: string): Promise<Transaction>;
    /**
     * Creates a transaction to unstake SUI tokens from a validator.
     *
     * @param stakedSuiId - The ID of the staked SUI object to withdraw.
     *
     * @returns A promise that resolves to a Transaction object ready to be signed and executed.
     *
     * @throws Will throw an error if the transaction preparation fails.
     */
    unstake(stakedSuiId: string): Promise<Transaction>;
    /**
     * Validates if a string is a valid Sui address.
     *
     * @param address - The string to validate as a Sui address.
     *
     * @returns A boolean indicating whether the string is a valid Sui address.
     */
    private isAddress;
}

export { Sui };
