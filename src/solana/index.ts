/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  Authorized,
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  EpochInfo,
  Keypair,
  Lockup,
  PublicKey,
  Signer,
  StakeProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { Blockchain } from '../utils';
import { ERROR_MESSAGES } from './constants/errors';
import {
  SOL_DEVNET_VALIDATOR_ADDRESS,
  FILTER_DATA_SIZE,
  FILTER_OFFSET,
  SOL_MAINNET_VALIDATOR_ADDRESS,
  SOL_MIN_AMOUNT,
  SolNetwork,
  StakeState,
} from './constants';
import {
  SolAccount,
  SolAccountToSplit,
  ApiResponse,
  SolCreateAccountResponse,
  SolDelegation,
} from './types';
import BigNumber from 'bignumber.js';
import { StakeAccount } from './stakeAccount';

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
  private validator: PublicKey;
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(
    network: SolNetwork = SolNetwork.Mainnet,
    rpc: string | null = null,
  ) {
    super();
    if (rpc && !this.isValidURL(rpc)) {
      throw this.throwError('INVALID_RPC_ERROR');
    }
    rpc = rpc || clusterApiUrl(network);
    try {
      this.connection = new Connection(rpc, 'confirmed');
    } catch (error) {
      throw this.handleError('CONNECTION_ERROR', error);
    }
    switch (network) {
      case SolNetwork.Mainnet:
        this.validator = SOL_MAINNET_VALIDATOR_ADDRESS;
        break;
      case SolNetwork.Devnet:
        this.validator = SOL_DEVNET_VALIDATOR_ADDRESS;
        break;
      default:
        throw this.throwError('UNSUPPORTED_NETWORK_ERROR');
    }
  }

  /**
   * Creates a new stake account.
   *
   * @param address - The public key of the account as PublicKey.
   * @param lamports  - The amount to stake in lamports.
   * @param source  - stake source
   * @param lockup - stake account lockup
   *
   * @throws  Throws an error if the lamports is less than the minimum amount.
   * @throws  Throws an error if there's an issue creating the stake account.
   *
   * @returns Returns a promise that resolves with the versioned transaction of the stake account creation and the public key of the stake account.
   *
   */
  public async createAccount(
    address: PublicKey,
    lamports: number,
    source: string | null,
    lockup: Lockup | null = Lockup.default,
  ): Promise<ApiResponse<SolCreateAccountResponse>> {
    // Check if the amount is greater than or equal to the minimum amount
    if (lamports < SOL_MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', SOL_MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);

      // Get the minimum balance for rent exemption
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );
      lockup = lockup || Lockup.default;

      const [createStakeAccountTx, stakeAccountPublicKey, externalSigners] =
        source === null
          ? await this.createAccountTx(
              publicKey,
              lamports + minimumRent,
              lockup,
            )
          : await this.createAccountWithSeedTx(
              publicKey,
              lamports + minimumRent,
              source,
              lockup,
            );

      const versionedTX = await this.prepareTransaction(
        createStakeAccountTx.instructions,
        publicKey,
        externalSigners,
      );

      return {
        result: {
          createStakeAccountVerTx: versionedTX,
          stakeAccount: stakeAccountPublicKey,
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
   * @param externalSigners - an array of external signers.
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  public async prepareTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    externalSigners: Signer[],
  ): Promise<VersionedTransaction> {
    const blockhash = await this.getBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    if (externalSigners.length > 0) {
      tx.sign(externalSigners);
    }

    return tx;
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
   * @param address - The public key of the account.
   * @param lamports - The amount in lamports to be delegated.
   * @param stakeAccount - The public key of the stake account.
   *
   * @throws Throws an error if the amount is less than the minimum amount, or if there's an issue during the delegation process.
   *
   * @returns Returns a promise that resolves with the delegation transaction.
   *
   */
  public async delegate(
    address: string,
    lamports: number,
    stakeAccount: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    if (lamports < SOL_MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', SOL_MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);
      const stakeAccountPublicKey = new PublicKey(stakeAccount);

      const delegateTx = new Transaction().add(
        StakeProgram.delegate({
          stakePubkey: stakeAccountPublicKey,
          authorizedPubkey: publicKey,
          votePubkey: this.validator,
        }),
      );

      const delegateVerTx = await this.prepareTransaction(
        delegateTx.instructions,
        publicKey,
        [],
      );

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
        [],
      );

      return { result: deactivateVerTx };
    } catch (error) {
      throw this.handleError('DEACTIVATE_ERROR', error);
    }
  }

  /**
   * Withdraws a specified amount from a stake account.
   *
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @param stakeBalance - The amount in lamports to be withdrawn from the stake account.
   *
   * @throws Throws an error if there's an issue during the withdrawal process.
   *
   * @returns Returns a promise that resolves with the withdrawal transaction.
   *
   */
  public async withdraw(
    address: string,
    stakeAccountPublicKey: PublicKey,
    stakeBalance: number,
  ): Promise<ApiResponse<VersionedTransaction>> {
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

      const withdrawVerTx = await this.prepareTransaction(
        withdrawTx.instructions,
        publicKey,
        [],
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
   *
   * @throws Throws an error if there's an issue fetching the delegations.
   *
   * @returns Returns a promise that resolves with the delegations of the account.
   *
   */
  public async getDelegations(
    address: string,
  ): Promise<ApiResponse<Array<SolDelegation>>> {
    try {
      // Define the filters for the getParsedProgramAccounts method
      const filters = [
        { dataSize: FILTER_DATA_SIZE },
        { memcmp: { offset: FILTER_OFFSET, bytes: address } },
      ];

      // Fetch the accounts
      const accounts = await this.connection.getParsedProgramAccounts(
        StakeProgram.programId,
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
   * @param source  - stake source
   * @param lockup - stake account lockup
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  async stake(
    sender: string,
    lamports: number,
    source: string | null,
    lockup: Lockup | null = Lockup.default,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const senderPublicKey = new PublicKey(sender);

      // Calculate how much we want to stake
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );
      lockup = lockup || Lockup.default;

      const [createStakeAccountTx, stakeAccountPublicKey, externalSigners] =
        source === null
          ? await this.createAccountTx(
              senderPublicKey,
              lamports + minimumRent,
              lockup,
            )
          : await this.createAccountWithSeedTx(
              senderPublicKey,
              lamports + minimumRent,
              source,
              lockup,
            );

      const stakeTx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
        createStakeAccountTx,
        StakeProgram.delegate({
          stakePubkey: stakeAccountPublicKey,
          authorizedPubkey: senderPublicKey,
          votePubkey: this.validator,
        }),
      );

      const stakeVerTx = await this.prepareTransaction(
        stakeTx.instructions,
        senderPublicKey,
        externalSigners,
      );

      return { result: stakeVerTx };
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }

  /**
   * Create account Tx, public key and array of keypair.
   *
   * @param address - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param lockup - The stake account lockup
   *
   * @throws Throws an error if there's an issue creating an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async createAccountTx(
    address: PublicKey,
    lamports: number,
    lockup: Lockup,
  ): Promise<[Transaction, PublicKey, Keypair[]]> {
    const blockhash = await this.getBlockhash();
    const stakeAccount = Keypair.generate();
    const createStakeAccountTx = StakeProgram.createAccount({
      authorized: new Authorized(address, address),
      fromPubkey: address,
      lamports: lamports,
      stakePubkey: stakeAccount.publicKey,
      lockup: lockup,
    });
    createStakeAccountTx.recentBlockhash = blockhash;
    createStakeAccountTx.sign(stakeAccount);

    return [createStakeAccountTx, stakeAccount.publicKey, [stakeAccount]];
  }

  /**
   * Create account Tx, public key and array of keypair using seed.
   *
   * @param authorityPublicKey - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param source - The stake source
   * @param lockup - The stake account lockup
   *
   * @throws Throws an error if there's an issue creating an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async createAccountWithSeedTx(
    authorityPublicKey: PublicKey,
    lamports: number,
    source: string,
    lockup: Lockup,
  ): Promise<[Transaction, PublicKey, Keypair[]]> {
    // Format source to
    const seed = this.formatSource(source);

    const stakeAccountPubkey = await PublicKey.createWithSeed(
      authorityPublicKey,
      seed,
      StakeProgram.programId,
    );

    const createStakeAccountTx = new Transaction().add(
      StakeProgram.createAccountWithSeed({
        authorized: new Authorized(authorityPublicKey, authorityPublicKey),
        fromPubkey: authorityPublicKey,
        basePubkey: authorityPublicKey,
        stakePubkey: stakeAccountPubkey,
        lockup: lockup,
        seed: seed,
        lamports: lamports,
      }),
    );

    return [createStakeAccountTx, stakeAccountPubkey, []];
  }

  /** unstake - unstake
   * @param {string} sender - account blockchain address (staker)
   * @param {number} lamports - lamport amount
   * @param {string} source - stake source
   * @returns {Promise<object>} Promise object with Versioned Tx
   */
  public async unstake(
    sender: string,
    lamports: number,
    source: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const delegations = await this.getDelegations(sender);

      const stakeAccounts = delegations.result.map((delegationAcc) => {
        return {
          pubkey: delegationAcc.pubkey,
          account: new StakeAccount(delegationAcc.account),
        };
      });

      const epochInfo = await this.connection.getEpochInfo();
      const tm = this.timestampInSec();

      let totalActiveStake = new BigNumber(0);
      const activeStakeAccounts = stakeAccounts.filter((acc) => {
        const isActive = !(
          acc.account.isLockupInForce(epochInfo.epoch, tm) ||
          acc.account.stakeAccountState(epochInfo.epoch) !== StakeState.active
        );
        if (isActive && acc.account.account.data.info.stake) {
          totalActiveStake = totalActiveStake.plus(
            acc.account.account.data.info.stake.delegation.stake,
          );
        }

        return isActive;
      });

      let lamportsBN = new BigNumber(lamports);
      if (totalActiveStake.lt(lamportsBN))
        throw this.throwError('NOT_ENOUGH_ACTIVE_STAKE_ERROR');

      // ASC sorting
      activeStakeAccounts.sort((a, b): number => {
        const stakeA = a.account.account.data.info.stake?.delegation.stake;
        const stakeB = b.account.account.data.info.stake?.delegation.stake;
        if (!stakeA || !stakeB) return 0;

        return stakeA.minus(stakeB).toNumber();
      });

      const accountsToDeactivate: SolAccount[] = [];
      const accountsToSplit: SolAccountToSplit[] = [];

      let i = 0;
      while (
        lamportsBN.gt(new BigNumber(0)) &&
        i < activeStakeAccounts.length
      ) {
        const acc = activeStakeAccounts[i];
        if (acc === undefined || acc.account.account.data.info.stake === null) {
          i++;
          continue;
        }
        const stakeAmount =
          acc.account.account.data.info.stake.delegation.stake;

        // If reminder amount less than min stake amount stake account automatically become disabled
        const isBelowThreshold =
          stakeAmount.lte(lamportsBN) ||
          stakeAmount.minus(lamportsBN).lt(SOL_MIN_AMOUNT);
        if (isBelowThreshold) {
          accountsToDeactivate.push(acc);
          lamportsBN = lamportsBN.minus(stakeAmount);
          i++;
          continue;
        }

        accountsToSplit.push({ account: acc, lamports: lamportsBN.toNumber() });
        break;
      }

      const senderPublicKey = new PublicKey(sender);

      let instructions = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
      ];

      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );

      for (const acc of accountsToSplit) {
        const [tx, newStakeAccountPubkey] = await this.split(
          senderPublicKey,
          acc.lamports,
          acc.account.pubkey,
          source,
          minimumRent,
        );

        const deactivateTx = StakeProgram.deactivate({
          stakePubkey: newStakeAccountPubkey,
          authorizedPubkey: senderPublicKey,
        });

        instructions.push(...tx.instructions, ...deactivateTx.instructions);
      }

      for (const acc of accountsToDeactivate) {
        const deactivateTx = StakeProgram.deactivate({
          stakePubkey: acc.pubkey,
          authorizedPubkey: senderPublicKey,
        });

        instructions.push(...deactivateTx.instructions);
      }

      // cast instructions to correct JSON Serialization
      instructions = instructions.map((instruction) => {
        return new TransactionInstruction(instruction);
      });

      const versionedTX = await this.prepareTransaction(
        instructions,
        senderPublicKey,
        [],
      );

      return { result: versionedTX };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  /**
   * Split existing account to create a new one
   *
   * @param authorityPublicKey - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param oldStakeAccountPubkey -The public key of the old account.
   * @param source - The stake source
   *
   * @throws Throws an error if there's an issue splitting an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async split(
    authorityPublicKey: PublicKey,
    lamports: number,
    oldStakeAccountPubkey: PublicKey,
    source: string,
    rentExemptReserve: number,
  ): Promise<[Transaction, PublicKey, Keypair[]]> {
    // Format source to
    const seed = this.formatSource(source);

    const newStakeAccountPubkey = await PublicKey.createWithSeed(
      authorityPublicKey,
      seed,
      StakeProgram.programId,
    );

    const splitStakeAccountTx = new Transaction().add(
      StakeProgram.splitWithSeed(
        {
          stakePubkey: oldStakeAccountPubkey,
          authorizedPubkey: authorityPublicKey,
          splitStakePubkey: newStakeAccountPubkey,
          basePubkey: authorityPublicKey,
          seed: seed,
          lamports: lamports,
        },
        rentExemptReserve,
      ),
    );

    return [splitStakeAccountTx, newStakeAccountPubkey, []];
  }

  /**
   * Claim makes withdrawal from all sender's deactivated accounts.
   *
   * @param sender - The sender solana address.
   *
   * @throws Throws an error if there's an issue while claiming a stake.
   *
   * @returns Returns a promise that resolves with a Versioned Transaction.
   *
   */
  public async claim(
    sender: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const delegations = await this.getDelegations(sender);

      const stakeAccounts = delegations.result.map((delegationAcc) => {
        return {
          pubkey: delegationAcc.pubkey,
          account: new StakeAccount(delegationAcc.account),
        };
      });

      const epochInfo = await this.connection.getEpochInfo();
      const tm = this.timestampInSec();

      let totalClaimableStake = new BigNumber(0);
      const deactivatedStakeAccounts = stakeAccounts.filter((acc) => {
        const { data } = acc.account.account;
        const { info } = data;
        const isDeactivated =
          !acc.account.isLockupInForce(epochInfo.epoch, tm) &&
          acc.account.stakeAccountState(epochInfo.epoch) ===
            StakeState.deactivated;
        if (info.stake && isDeactivated) {
          totalClaimableStake = totalClaimableStake.plus(
            info.stake.delegation.stake,
          );
        }

        return isDeactivated;
      });

      if (deactivatedStakeAccounts.length === 0)
        throw this.throwError('NOTHING_TO_CLAIM_ERROR');

      const senderPublicKey = new PublicKey(sender);
      let instructions = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
      ];
      for (const acc of deactivatedStakeAccounts) {
        const withdrawTx = StakeProgram.withdraw({
          stakePubkey: acc.pubkey,
          authorizedPubkey: senderPublicKey,
          toPubkey: senderPublicKey,
          lamports: acc.account.account.lamports,
        });
        instructions.push(...withdrawTx.instructions);
      }

      // cast instructions to correct JSON Serialization
      instructions = instructions.map((instruction) => {
        return new TransactionInstruction(instruction);
      });

      const versionedTX = await this.prepareTransaction(
        instructions,
        senderPublicKey,
        [],
      );

      return { result: versionedTX };
    } catch (error) {
      throw this.handleError('CLAIM_ERROR', error);
    }
  }

  public async getEpochInfo(): Promise<ApiResponse<EpochInfo>> {
    try {
      const epochInfo = await this.connection.getEpochInfo();

      return { result: epochInfo };
    } catch (error) {
      throw this.handleError('GET_EPOCH_INFO_ERROR', error);
    }
  }

  /**
   * Merge two accounts into a new one
   *
   * @param authorityPublicKey - The public key of the account.
   * @param stakeAccount1 - The public key of the first account.
   * @param stakeAccount2 - The public key of the second account.
   *
   * @throws Throws an error if there's an issue while merging an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async merge(
    authorityPublicKey: PublicKey,
    stakeAccount1: PublicKey,
    stakeAccount2: PublicKey,
  ) {
    const mergeStakeAccountTx = StakeProgram.merge({
      stakePubkey: stakeAccount1,
      sourceStakePubKey: stakeAccount2,
      authorizedPubkey: authorityPublicKey,
    });

    return [mergeStakeAccountTx];
  }

  /**
   * Generate a unique source for crating an account.
   *
   * @param source - source ID.
   *
   * @returns Returns a unique source for an account.
   *
   */
  private formatSource(source: string): string {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
  }

  /**
   * Generate timestamp in seconds.
   *
   * @returns Returns a timestamp in seconds.
   *
   */
  private timestampInSec(): number {
    return (Date.now() / 1000) | 0;
  }
}
