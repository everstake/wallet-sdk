import {
  Authorized,
  Cluster,
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { CheckToken, SetStats } from '../utils/api';
import { Blockchain } from '../utils';
import { ERROR_MESSAGES } from './constants/errors';
import { MIN_AMOUNT, VALIDATOR_ADDRESS, CHAIN } from './constants';
import { ApiResponse, CreateAccountResponse, Delegation } from './types';

/**
 * The `Solana` class extends the `Blockchain` class and provides methods for interacting with the Solana blockchain.
 *
 * @property connection - The connection to the Solana blockchain.
 * @property ERROR_MESSAGES - The error messages for the Solana class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Solana class.

 * @throws Throws an error if there's an issue establishing the connection.
 */
export class Solana extends Blockchain {
  private connection!: Connection;
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(cluster: Cluster = 'mainnet-beta') {
    super();
    try {
      this.connection = new Connection(clusterApiUrl(cluster), 'confirmed');
    } catch (error) {
      throw this.handleError('CONNECTION_ERROR', error);
    }
  }

  /**
   * Creates a new stake account.
   *
   * @param address - The public key of the account.
   * @param amount  - The amount to stake in SOL.
   * @throws  Throws an error if the amount is less than the minimum amount.
   * @throws  Throws an error if there's an issue creating the stake account.
   * @returns Returns a promise that resolves with the versioned transaction of the stake account creation and the public key of the stake account.
   *
   */
  public async createAccount(
    address: string,
    amount: number,
  ): Promise<ApiResponse<CreateAccountResponse>> {
    // Check if the amount is greater than or equal to the minimum amount
    if (amount < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);
      const stakeAccount = Keypair.generate();

      // Get the minimum balance for rent exemption
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );

      // Calculate the amount to stake
      const amountUserWantsToStake = amount * LAMPORTS_PER_SOL;
      const amountToStake = minimumRent + amountUserWantsToStake;

      // Create the stake account
      const createStakeAccountTx = new Transaction().add(
        StakeProgram.createAccount({
          authorized: new Authorized(publicKey, publicKey),
          fromPubkey: publicKey,
          lamports: amountToStake,
          stakePubkey: stakeAccount.publicKey,
        }),
      );

      const blockhash = await this.getBlockhash();
      createStakeAccountTx.recentBlockhash = blockhash;

      const createStakeAccountVerTx = await this.prepareTransaction(
        createStakeAccountTx.instructions,
        publicKey,
      );

      createStakeAccountVerTx.sign([stakeAccount]);

      return {
        result: {
          createStakeAccountVerTx,
          stakeAccount: stakeAccount.publicKey.toString(),
        },
      };
    } catch (error) {
      throw this.handleError('CREATE_ACCOUNT_ERROR', error);
    }
  }
  /**
   * Prepares a transaction with the given instructions and payer.
   *
   * @param instructions - An array of TransactionInstruction objects.
   * @param payer - The public key of the payer.
   *
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  public async prepareTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey,
  ): Promise<VersionedTransaction> {
    const blockhash = await this.getBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }
  /**
   * Retrieves the latest blockhash.
   *
   * @returns A promise that resolves to a string representing the blockhash.
   */
  public async getBlockhash(): Promise<string> {
    const res = await this.connection.getLatestBlockhash({
      commitment: 'max',
    });

    return res.blockhash;
  }

  /**
   * Delegates a specified amount from a stake account to a validator.
   *
   * @param token - The token to be used for the delegation.
   * @param address - The public key of the account.
   * @param amount - The amount to be delegated.
   * @param stakeAccount - The public key of the stake account.
   * @throws Throws an error if the token is invalid, the amount is less than the minimum amount, or if there's an issue during the delegation process.
   * @returns Returns a promise that resolves with the delegation transaction.
   *
   */
  public async delegate(
    token: string,
    address: string,
    amount: number,
    stakeAccount: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    const isTokenValid = await CheckToken(token);
    if (!isTokenValid) {
      this.throwError('INVALID_TOKEN_ERROR');
    }

    if (amount < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);
      const stakeAccountPublicKey = new PublicKey(stakeAccount);
      const selectedValidatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

      const delegateTx = new Transaction().add(
        StakeProgram.delegate({
          stakePubkey: stakeAccountPublicKey,
          authorizedPubkey: publicKey,
          votePubkey: selectedValidatorPubkey,
        }),
      );

      const delegateVerTx = await this.prepareTransaction(
        delegateTx.instructions,
        publicKey,
      );

      await SetStats({
        token,
        action: 'stake',
        amount,
        address,
        chain: CHAIN,
      });

      return { result: delegateVerTx };
    } catch (error) {
      throw this.handleError('DELEGATE_ERROR', error);
    }
  }

  /**
   * Deactivates a stake account.
   *
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @throws Throws an error if there's an issue during the deactivation process.
   * @returns Returns a promise that resolves with the deactivation transaction.
   *
   */
  public async deactivate(
    address: string,
    stakeAccountPublicKey: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const publicKey = new PublicKey(address);
      const stakeAccount = new PublicKey(stakeAccountPublicKey);

      // Create the deactivate transaction
      const deactivateTx = new Transaction().add(
        StakeProgram.deactivate({
          stakePubkey: stakeAccount,
          authorizedPubkey: publicKey,
        }),
      );

      const deactivateVerTx = await this.prepareTransaction(
        deactivateTx.instructions,
        publicKey,
      );

      return { result: deactivateVerTx };
    } catch (error) {
      throw this.handleError('DEACTIVATE_ERROR', error);
    }
  }

  /**
   * Withdraws a specified amount from a stake account.
   *
   * @param token - The token to be used for the withdrawal.
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @param stakeBalance - The amount to be withdrawn from the stake account.
   * @throws Throws an error if the token is invalid or if there's an issue during the withdrawal process.
   * @returns Returns a promise that resolves with the withdrawal transaction.
   *
   */
  public async withdraw(
    token: string,
    address: string,
    stakeAccountPublicKey: PublicKey,
    stakeBalance: number,
  ): Promise<ApiResponse<VersionedTransaction>> {
    // Check if the token is valid
    const isTokenValid = await CheckToken(token);
    if (!isTokenValid) {
      this.throwError('INVALID_TOKEN_ERROR');
    }

    try {
      const publicKey = new PublicKey(address);
      const stakeAccount = new PublicKey(stakeAccountPublicKey);

      // Create the withdraw transaction
      const withdrawTx = new Transaction().add(
        StakeProgram.withdraw({
          stakePubkey: stakeAccount,
          authorizedPubkey: publicKey,
          toPubkey: publicKey,
          lamports: stakeBalance,
        }),
      );

      // Update the stats
      await SetStats({
        token,
        action: 'unstake',
        amount: stakeBalance / LAMPORTS_PER_SOL,
        address,
        chain: CHAIN,
      });

      const withdrawVerTx = await this.prepareTransaction(
        withdrawTx.instructions,
        publicKey,
      );

      return { result: withdrawVerTx };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  /**
   * Fetches the delegations of a given account.
   *
   * @param address - The public key of the account.
   * @throws Throws an error if there's an issue fetching the delegations.
   * @returns Returns a promise that resolves with the delegations of the account.
   *
   */
  public async getDelegations(
    address: string,
  ): Promise<ApiResponse<Array<Delegation>>> {
    try {
      // Define the stake program address
      const stakeProgramAddress = new PublicKey(
        'Stake11111111111111111111111111111111111111',
      );

      // Define the filters for the getParsedProgramAccounts method
      const filters = [
        { dataSize: 200 },
        { memcmp: { offset: 44, bytes: address } },
      ];

      // Fetch the accounts
      const accounts = await this.connection.getParsedProgramAccounts(
        stakeProgramAddress,
        { filters },
      );

      return { result: accounts };
    } catch (error) {
      throw this.handleError('GET_DELEGATIONS_ERROR', error);
    }
  }

  /**
   * Stakes a certain amount of lamports.
   *
   * @param sender - The public key of the sender.
   * @param lamports - The number of lamports to stake.
   *
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  async stake(
    sender: string,
    lamports: number,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const senderPublicKey = new PublicKey(sender);
      const stakeAccount = Keypair.generate();
      const validatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

      // Calculate how much we want to stake
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );

      const stakeTx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
        StakeProgram.createAccount({
          authorized: new Authorized(senderPublicKey, senderPublicKey),
          fromPubkey: senderPublicKey,
          lamports: lamports + minimumRent,
          stakePubkey: stakeAccount.publicKey,
        }),
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: senderPublicKey,
          votePubkey: validatorPubkey,
        }),
      );

      const stakeVerTx = await this.prepareTransaction(
        stakeTx.instructions,
        senderPublicKey,
      );
      stakeVerTx.sign([stakeAccount]);

      return { result: stakeVerTx };
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }
}
