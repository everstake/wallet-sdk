import {
  Authorized,
  Cluster,
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  StakeProgram,
  Lockup,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { CheckToken, SetStats } from '../utils/api';
import { Blockchain } from '../utils';
import { ERROR_MESSAGES } from './constants/errors';
import {
  MIN_AMOUNT,
  MAINNET_VALIDATOR_ADDRESS,
  DEVNET_VALIDATOR_ADDRESS,
  CHAIN,
  FILTER_DATA_SIZE,
  FILTER_OFFSET,
} from './constants';
import { ApiResponse, CreateAccountResponse, Delegation } from './types';
import BigNumber from 'bignumber.js';
import {
  isLockupInForce,
  parsedAccountInfoToStakeAccount,
  stakeAccountState,
  StakeState,
} from './stake_account';

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
  private validator: string;
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(cluster: Cluster = 'mainnet-beta') {
    super();
    try {
      this.connection = new Connection(clusterApiUrl(cluster), 'confirmed');
    } catch (error) {
      throw this.handleError('CONNECTION_ERROR', error);
    }
    switch (cluster) {
      case 'mainnet-beta':
        this.validator = MAINNET_VALIDATOR_ADDRESS;
        break;
      case 'devnet':
        this.validator = DEVNET_VALIDATOR_ADDRESS;
        break;
      default:
        throw new Error(`Unsupported network ${cluster}`);
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
    lockup: Lockup = Lockup.default,
  ): Promise<ApiResponse<CreateAccountResponse>> {
    // Check if the amount is greater than or equal to the minimum amount
    if (lamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);

      // Get the minimum balance for rent exemption
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );
      lockup = lockup === null ? Lockup.default : lockup;

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
   * @param token - The token to be used for the delegation.
   * @param address - The public key of the account.
   * @param lamports - The amount in lamports to be delegated.
   * @param stakeAccount - The public key of the stake account.
   *
   * @throws Throws an error if the token is invalid, the amount is less than the minimum amount, or if there's an issue during the delegation process.
   *
   * @returns Returns a promise that resolves with the delegation transaction.
   *
   */
  public async delegate(
    token: string,
    address: string,
    lamports: number,
    stakeAccount: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    const isTokenValid = await CheckToken(token);
    if (!isTokenValid) {
      this.throwError('INVALID_TOKEN_ERROR');
    }

    if (lamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const publicKey = new PublicKey(address);
      const stakeAccountPublicKey = new PublicKey(stakeAccount);
      const selectedValidatorPubkey = new PublicKey(this.validator);

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
        [],
      );

      await SetStats({
        token,
        action: 'stake',
        amount: lamports / LAMPORTS_PER_SOL,
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
   * @param token - The token to be used for the withdrawal.
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @param stakeBalance - The amount in lamports to be withdrawn from the stake account.
   *
   * @throws Throws an error if the token is invalid or if there's an issue during the withdrawal process.
   *
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
  ): Promise<ApiResponse<Array<Delegation>>> {
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
   * @param token - The token to be used for the delegation.
   * @param sender - The public key of the sender.
   * @param lamports - The number of lamports to stake.
   * @param source  - stake source
   * @param lockup - stake account lockup
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  async stake(
    token: string,
    sender: string,
    lamports: number,
    source: string | null,
    lockup: Lockup = Lockup.default,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const senderPublicKey = new PublicKey(sender);
      const validatorPubkey = new PublicKey(this.validator);

      // Calculate how much we want to stake
      const minimumRent =
        await this.connection.getMinimumBalanceForRentExemption(
          StakeProgram.space,
        );
      lockup = lockup === null ? Lockup.default : lockup;

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
          votePubkey: validatorPubkey,
        }),
      );

      const stakeVerTx = await this.prepareTransaction(
        stakeTx.instructions,
        senderPublicKey,
        externalSigners,
      );

      // Update the stats
      await SetStats({
        token,
        action: 'stake',
        amount: lamports / LAMPORTS_PER_SOL,
        address: sender,
        chain: CHAIN,
      });

      return { result: stakeVerTx };
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }

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
   * @param {string} token - auth API token
   * @param {string} sender - account blockchain address (staker)
   * @param {number} lamports - lamport amount
   * @param {string} source - stake source
   * @returns {Promise<object>} Promise object with Versioned Tx
   */
  public async unstake(
    token: string,
    sender: string,
    lamports: number,
    source: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    // Check if the token is valid
    const isTokenValid = await CheckToken(token);
    if (!isTokenValid) {
      this.throwError('INVALID_TOKEN_ERROR');
    }

    try {
      const delegations = await this.getDelegations(sender);

      const stakeAccounts = delegations.result.map((delegationAcc) => {
        return {
          pubkey: delegationAcc.pubkey,
          account: parsedAccountInfoToStakeAccount(delegationAcc.account),
        };
      });

      const epochInfo = await this.connection.getEpochInfo();
      // Timestamp in seconds
      const tm = (Date.now() / 1000) | 0;

      let totalActiveStake = new BigNumber(0);
      const activeStakeAccounts = stakeAccounts.filter((acc) => {
        const isActive = !(
          isLockupInForce(acc.account.data.info.meta, epochInfo.epoch, tm) ||
          stakeAccountState(acc.account.data, epochInfo.epoch) !==
            StakeState.Active
        );
        if (isActive && acc.account.data.info.stake !== null) {
          totalActiveStake = totalActiveStake.plus(
            acc.account.data.info.stake.delegation.stake,
          );
        }

        return isActive;
      });

      let lamportsBN = new BigNumber(lamports);
      if (totalActiveStake.lt(lamportsBN))
        throw new Error('Active stake less than requested');

      // Desc sorting
      activeStakeAccounts.sort((a, b): number => {
        if (
          a.account.data.info.stake === null ||
          b.account.data.info.stake === null
        ) {
          return 0;
        }

        if (
          a.account.data.info.stake.delegation.stake.lte(
            b.account.data.info.stake.delegation.stake,
          )
        ) {
          return 1;
        }

        return -1;
      });

      const accountsToDeactivate = [];
      const accountsToSplit = [];
      let i = 0;
      while (
        lamportsBN.gt(new BigNumber(0)) &&
        i < activeStakeAccounts.length
      ) {
        const lBN = new BigNumber(lamports);
        const acc = activeStakeAccounts[i];
        if (acc === undefined || acc.account.data.info.stake === null) {
          i++;
          continue;
        }
        const stakeAmount = new BigNumber(
          acc.account.data.info.stake.delegation.stake,
        );

        // If reminder amount less than min stake amount stake account automatically become disabled
        if (
          stakeAmount.comparedTo(lBN) <= 0 ||
          stakeAmount.minus(lBN).lt(new BigNumber(MIN_AMOUNT))
        ) {
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
      for (const acc of accountsToSplit) {
        const [tx, newStakeAccountPubkey] = await this.split(
          senderPublicKey,
          acc.lamports,
          acc.account.pubkey,
          source,
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

      await SetStats({
        action: 'unstake',
        address: sender,
        amount: lamports / LAMPORTS_PER_SOL,
        chain: CHAIN,
        token: token,
      });

      return { result: versionedTX };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  private async split(
    authorityPublicKey: PublicKey,
    lamports: number,
    oldStakeAccountPubkey: PublicKey,
    source: string,
  ): Promise<[Transaction, PublicKey, Keypair[]]> {
    // Format source to
    const seed = this.formatSource(source);

    const newStakeAccountPubkey = await PublicKey.createWithSeed(
      authorityPublicKey,
      seed,
      StakeProgram.programId,
    );

    const splitStakeAccountTx = new Transaction().add(
      StakeProgram.splitWithSeed({
        stakePubkey: oldStakeAccountPubkey,
        authorizedPubkey: authorityPublicKey,
        splitStakePubkey: newStakeAccountPubkey,
        basePubkey: authorityPublicKey,
        seed: seed,
        lamports: lamports,
      }),
    );

    return [splitStakeAccountTx, newStakeAccountPubkey, []];
  }

  public async claim(
    sender: string,
  ): Promise<ApiResponse<VersionedTransaction>> {
    try {
      const delegations = await this.getDelegations(sender);

      const stakeAccounts = delegations.result.map((delegationAcc) => {
        return {
          pubkey: delegationAcc.pubkey,
          account: parsedAccountInfoToStakeAccount(delegationAcc.account),
        };
      });

      const epochInfo = await this.connection.getEpochInfo();
      // Timestamp in seconds
      const tm = (Date.now() / 1000) | 0;

      let totalClaimableStake = new BigNumber(0);
      const deactivatedStakeAccounts = stakeAccounts.filter((acc) => {
        const isDeactivated =
          !isLockupInForce(acc.account.data.info.meta, epochInfo.epoch, tm) &&
          stakeAccountState(acc.account.data, epochInfo.epoch) ===
            StakeState.Deactivated;

        if (acc.account.data.info.stake != null && isDeactivated) {
          totalClaimableStake = totalClaimableStake.plus(
            acc.account.data.info.stake.delegation.stake,
          );
        }

        return isDeactivated;
      });

      if (deactivatedStakeAccounts.length === 0)
        throw new Error('Nothing to claim');

      const senderPublicKey = new PublicKey(sender);
      let instructions = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
      ];
      for (const acc of deactivatedStakeAccounts) {
        const withdrawTx = StakeProgram.withdraw({
          stakePubkey: acc.pubkey,
          authorizedPubkey: senderPublicKey,
          toPubkey: senderPublicKey,
          lamports: acc.account.lamports,
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

  private formatSource(source: string): string {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
  }
}
