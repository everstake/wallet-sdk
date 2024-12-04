import {
  // Authorized,
  // clusterApiUrl,
  // ComputeBudgetProgram,
  // Connection,
  // Keypair,
  // Lockup,
  // PublicKey,
  Address,
  Account,
  // Signer,
  // StakeProgram,
  // Transaction,
  // TransactionInstruction,
  // TransactionMessage,
  // VersionedTransaction,
  // TransactionVersion,
  createAddressWithSeed,
  createSolanaRpc,
  mainnet,
  // devnet,
  // Blockhash,
  // CompilableTransactionMessage,
  // TransactionMessage,
  ClusterUrl,
  address,
  // blockhash,
  // lamports,
  TransactionMessageWithBlockhashLifetime,
  //
  createNoopSigner,
  //
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  //
  RpcFromTransport,
  SolanaRpcApiFromTransport,
  RpcTransportFromClusterUrl,
  IInstruction,
  generateKeyPair,
  createSignerFromKeyPair,
  signTransactionMessageWithSigners,

  // AccountInfoWithPubkey,
  // AccountInfoBase,
  parseBase64RpcAccount,
  // MaybeEncodedAccount,
  // TAddresses
} from '@solana/web3.js';
import {
  getCreateAccountWithSeedInstruction,
  getCreateAccountInstruction,
  // getAllocateInstruction,
  getAllocateWithSeedInstruction,
} from '@solana-program/system';

import { Blockchain } from '../utils';
import { ERROR_MESSAGES } from './constants/errors';
import {
  DEVNET_VALIDATOR_ADDRESS,
  FILTER_DATA_SIZE,
  FILTER_OFFSET,
  MAINNET_VALIDATOR_ADDRESS,
  MIN_AMOUNT,
  Network,
  StakeState,
} from './constants';
import {
  // Account,
  // AccountToSplit,
  ApiResponse,
  CreateAccountResponse,
  ClaimResponse,
  StakeResponse,
  // Delegation,
} from './types';
// import { StakeAccount } from './stakeAccount';
import {
  getWithdrawInstruction,
  getDeactivateInstruction,
  getDelegateStakeInstruction,
  STAKE_PROGRAM_ADDRESS,
  getInitializeInstruction,
  getSplitInstruction,
  decodeStakeStateAccount,
  StakeStateAccount,
  StakeStateV2,
  Meta,
  Stake,
  StakeFlags,
} from './temp';

//TODO move to consts
const STAKE_ACCOUNT_V2_SIZE = 200;
const ADDRESS_DEFAULT = address('11111111111111111111111111111111');

/**
 * The `Solana` class extends the `Blockchain` class and provides methods for interacting with the Solana blockchain.
 *
 * @property connection - The connection to the Solana blockchain.
 * @property ERROR_MESSAGES - The error messages for the Solana class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Solana class.

 * @throws Throws an error if there's an issue establishing the connection.
 */
export class Solana extends Blockchain {
  private connection!: RpcFromTransport<
    SolanaRpcApiFromTransport<RpcTransportFromClusterUrl<ClusterUrl>>,
    RpcTransportFromClusterUrl<ClusterUrl>
  >;
  private validator: Address;
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(network: Network = Network.Mainnet, rpc: string | null = null) {
    super();
    if (rpc && !this.isValidURL(rpc)) {
      throw this.throwError('INVALID_RPC_ERROR');
    }
    rpc = rpc || mainnet('https://api.mainnet-beta.solana.com');
    // rpc = rpc || mainnet('https://api.devnet.solana.com');
    // TODO fix

    // const mainnetRpc = createSolanaRpc(mainnet('https://api.mainnet-beta.solana.com'));
    //    ^? RpcMainnet<SolanaRpcApiMainnet>

    // const devnetRpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
    try {
      this.connection = createSolanaRpc(rpc);
    } catch (error) {
      throw this.handleError('CONNECTION_ERROR', error);
    }
    switch (network) {
      case Network.Mainnet:
        this.validator = MAINNET_VALIDATOR_ADDRESS;
        break;
      case Network.Devnet:
        this.validator = DEVNET_VALIDATOR_ADDRESS;
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
    sender: string,
    amountInLamports: number,
    source: string | null,
    // lockup: Lockup | null = Lockup.default,
  ): Promise<ApiResponse<CreateAccountResponse>> {
    // Check if the amount is greater than or equal to the minimum amount
    if (amountInLamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      // Get the minimum balance for rent exemption
      const minimumRent = await this.connection
        .getMinimumBalanceForRentExemption(
          //TODO get from account when it's would be available
          BigInt(STAKE_ACCOUNT_V2_SIZE),
        )
        .send();

      //     lockup = lockup || Lockup.default;

      const [
        createAccountInstruction,
        initializeInstruction,
        stakeAccountPubkey,
      ] =
        source === null
          ? await this.createAccountTx(
              address(sender),
              amountInLamports + +minimumRent.toString(),
              // lockup,
            )
          : await this.createAccountWithSeedTx(
              address(sender),
              amountInLamports + +minimumRent.toString(),
              source,
              // lockup,
            );

      //   // Format source to
      // const seed = this.formatSource(source || '');
      // const stakeAccountPubkey = await createAddressWithSeed(
      //   {
      //     baseAddress: address(sender),
      //     programAddress: STAKE_PROGRAM_ADDRESS,
      //     seed: seed,
      //   }
      // );
      // const createAccountInstruction = getCreateAccountWithSeedInstruction({
      //   payer: createNoopSigner(address(sender)),
      //   newAccount: stakeAccountPubkey,
      //   baseAccount: createNoopSigner(address(sender)),
      //   base: address(sender),
      //   seed:seed,
      //   amount: BigInt(amountInLamports) + minimumRent,
      //   // TODO get from package
      //   space: 200,
      //   programAddress: STAKE_PROGRAM_ADDRESS,
      // });
      // // TODO Initialise
      // const initializeInstruction = getInitializeInstruction(
      //     /** Uninitialized stake account */
      //   {  stake: address(stakeAccountPubkey),
      //     arg0: {
      //       staker: address(sender),
      //       withdrawer: address(sender)
      //     },
      //     arg1: {
      //       //TODO
      //       unixTimestamp: 0,
      //       epoch: 0,
      //       custodian: address('0000'),
      //     },
      //   }
      // );

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstruction(createAccountInstruction, tx),
        (tx) => appendTransactionMessageInstruction(initializeInstruction, tx),
      );

      const signedTransactionMessage =
        await signTransactionMessageWithSigners(transactionMessage);

      return {
        result: {
          transaction: signedTransactionMessage,
          stakeAccount: stakeAccountPubkey,
        },
      };
    } catch (error) {
      throw this.handleError('CREATE_ACCOUNT_ERROR', error);
    }
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
    sender: string,
    lamports: number,
    stakeAccount: string,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    if (lamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const delegateInstruction = getDelegateStakeInstruction({
        stake: address(stakeAccount),
        vote: this.validator,
        stakeAuthority: createNoopSigner(address(sender)),
      });

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(delegateInstruction, tx),
      );

      return { result: transactionMessage };
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
    sender: string,
    stakeAccountPublicKey: string,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    try {
      const deactivateInstruction = getDeactivateInstruction({
        stake: address(stakeAccountPublicKey),
        stakeAuthority: createNoopSigner(address(sender)),
      });

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(deactivateInstruction, tx),
      );

      return { result: transactionMessage };
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
    sender: Address,
    stakeAccountPublicKey: Address,
    stakeBalance: number,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    try {
      // Create the withdraw instruction
      const withdrawInstruction = getWithdrawInstruction({
        stake: stakeAccountPublicKey,
        recipient: sender,
        withdrawAuthority: createNoopSigner(address(sender)),
        args: stakeBalance,
      });

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
        (tx) => appendTransactionMessageInstruction(withdrawInstruction, tx),
      );

      return { result: transactionMessage };
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
  ): Promise<ApiResponse<Array<Account<StakeStateAccount, Address>>>> {
    try {
      // Fetch the accounts
      const accounts = await this.connection
        .getProgramAccounts(STAKE_PROGRAM_ADDRESS, {
          encoding: 'base64',
          filters: [
            {
              dataSize: FILTER_DATA_SIZE, // Token account size
            },
            {
              memcmp: {
                bytes: address,
                encoding: 'base58',
                offset: FILTER_OFFSET,
              },
            },
          ],
        })
        .send();

      const acs = accounts.map((account) => {
        const acc = parseBase64RpcAccount(account.pubkey, account.account);

        return decodeStakeStateAccount(acc);
      });

      return { result: acs };
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
    // lockup: Lockup | null = Lockup.default,
  ): Promise<ApiResponse<StakeResponse>> {
    try {
      //     lockup = lockup || Lockup.default;
      // Get the minimum balance for rent exemption
      const minimumRent = await this.connection
        .getMinimumBalanceForRentExemption(
          //TODO get from account when would be added
          BigInt(STAKE_ACCOUNT_V2_SIZE),
        )
        .send();

      const [
        createStakeAccountInstruction,
        initializeStakeAccountInstruction,
        stakeAccountPublicKey,
      ] =
        source === null
          ? await this.createAccountTx(
              address(sender),
              //TODO fix
              lamports + +minimumRent.toString(),
              // lockup,
            )
          : await this.createAccountWithSeedTx(
              address(sender),
              //TODO fix
              lamports + +minimumRent.toString(),
              source,
              // lockup,
            );

      const delegateInstruction = getDelegateStakeInstruction({
        stake: stakeAccountPublicKey,
        vote: this.validator,
        stakeAuthority: createNoopSigner(address(sender)),
      });

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
        (tx) =>
          appendTransactionMessageInstruction(
            createStakeAccountInstruction,
            tx,
          ),
        (tx) =>
          appendTransactionMessageInstruction(
            initializeStakeAccountInstruction,
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(delegateInstruction, tx),
      );

      const signedTransactionMessage =
        await signTransactionMessageWithSigners(transactionMessage);

      return {
        result: {
          transaction: signedTransactionMessage,
          stakeAccount: stakeAccountPublicKey,
        },
      };
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
    authorityPublicKey: Address,
    lamports: number,
    // lockup: Lockup,
  ): Promise<[IInstruction, IInstruction, Address]> {
    // const blockhash = await this.getBlockhash();
    const stakeAccountKeyPair = await generateKeyPair();
    const signer = await createSignerFromKeyPair(stakeAccountKeyPair);

    const createAccountInstruction = getCreateAccountInstruction({
      payer: createNoopSigner(authorityPublicKey),
      newAccount: signer,
      lamports: lamports,
      // TODO get from package
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    const initializeInstruction = getInitializeInstruction(
      /** Uninitialized stake account */
      {
        stake: signer.address,
        arg0: {
          staker: authorityPublicKey,
          withdrawer: authorityPublicKey,
        },
        arg1: {
          //TODO use default
          unixTimestamp: 0,
          epoch: 0,
          custodian: ADDRESS_DEFAULT,
        },
      },
    );

    return [createAccountInstruction, initializeInstruction, signer.address];
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
    authorityPublicKey: Address,
    lamports: number,
    source: string,
    // lockup: Lockup,
  ): Promise<[IInstruction, IInstruction, Address]> {
    // Format source to
    const seed = this.formatSource(source || '');

    const stakeAccountPubkey = await createAddressWithSeed({
      baseAddress: authorityPublicKey,
      programAddress: STAKE_PROGRAM_ADDRESS,
      seed: seed,
    });

    const createAccountInstruction = getCreateAccountWithSeedInstruction({
      payer: createNoopSigner(authorityPublicKey),
      newAccount: stakeAccountPubkey,
      baseAccount: createNoopSigner(authorityPublicKey),
      base: address(authorityPublicKey),
      seed: seed,
      amount: lamports,
      // TODO get from package
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    const initializeInstruction = getInitializeInstruction(
      /** Uninitialized stake account */
      {
        stake: stakeAccountPubkey,
        arg0: {
          staker: authorityPublicKey,
          withdrawer: authorityPublicKey,
        },
        arg1: {
          //TODO
          unixTimestamp: 0,
          epoch: 0,
          custodian: ADDRESS_DEFAULT,
        },
      },
    );

    return [
      createAccountInstruction,
      initializeInstruction,
      stakeAccountPubkey,
    ];
  }

  /** unstake - unstake
   * @param {string} sender - account blockchain address (staker)
   * @param {bigint} lamports - lamport amount
   * @param {string} source - stake source
   * @returns {Promise<object>} Promise object with Versioned Tx
   */
  public async unstake(
    sender: string,
    lamports: bigint,
    source: string,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    try {
      const stakeAccounts = (await this.getDelegations(sender)).result;

      const epochInfo = await this.connection.getEpochInfo().send();
      const tm = this.timestampInSec();

      let totalActiveStake: bigint = 0n;
      const activeStakeAccounts = stakeAccounts.filter((acc) => {
        if (acc.data.state.__kind !== 'Stake') {
          return false;
        }

        const isActive = !(
          isLockupInForce(acc.data, epochInfo.epoch, BigInt(tm)) ||
          this.stakeAccountState(acc.data, epochInfo.epoch) !==
            StakeState.Active
        );

        if (isActive) {
          totalActiveStake =
            totalActiveStake + acc.data.state.fields[1].delegation.stake;
        }

        return isActive;
      });

      if (totalActiveStake < lamports)
        throw this.throwError('NOT_ENOUGH_ACTIVE_STAKE_ERROR');

      // Desc sorting
      activeStakeAccounts.sort((a, b): number => {
        const stakeA = isStake(a.data.state)
          ? a.data.state.fields[1].delegation.stake
          : 0n;
        const stakeB = isStake(b.data.state)
          ? b.data.state.fields[1].delegation.stake
          : 0n;

        return Number(stakeB - stakeA);
      });

      const accountsToDeactivate: Account<StakeStateAccount, Address>[] = [];
      const accountsToSplit: [Account<StakeStateAccount, Address>, bigint][] =
        [];

      let i = 0;
      while (lamports > 0n && i < activeStakeAccounts.length) {
        const acc = activeStakeAccounts[i];
        //TODO check stake
        if (
          acc === undefined /*|| acc.account.account.data.info.stake === null*/
        ) {
          i++;
          continue;
        }
        const stakeAmount = isStake(acc.data.state)
          ? acc.data.state.fields[1].delegation.stake
          : 0n;
        // acc.account.account.data.info.stake.delegation.stake;

        // If reminder amount less than min stake amount stake account automatically become disabled
        const isBelowThreshold =
          stakeAmount <= lamports || stakeAmount - lamports < MIN_AMOUNT;
        if (isBelowThreshold) {
          accountsToDeactivate.push(acc);
          lamports = lamports - stakeAmount;
          i++;
          continue;
        }

        accountsToSplit.push([acc, lamports]);
        break;
      }

      const senderPublicKey = address(sender);
      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
      );

      //     let instructions = [
      //       ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
      //     ];

      for (const acc of accountsToSplit) {
        const [instructions, newStakeAccountPubkey] = await this.split(
          senderPublicKey,
          acc[1],
          acc[0].address,
          source,
        );

        const deactivateInstruction = getDeactivateInstruction({
          stake: newStakeAccountPubkey,
          stakeAuthority: createNoopSigner(address(sender)),
        });

        pipe(
          transactionMessage,
          (tx) => appendTransactionMessageInstruction(instructions[0], tx),
          (tx) => appendTransactionMessageInstruction(instructions[1], tx),
          (tx) =>
            appendTransactionMessageInstruction(deactivateInstruction, tx),
        );

        // const deactivateTx = StakeProgram.deactivate({
        //   stakePubkey: newStakeAccountPubkey,
        //   authorizedPubkey: senderPublicKey,
        // });

        // instructions.push(...tx.instructions, ...deactivateTx.instructions);
      }

      for (const acc of accountsToDeactivate) {
        const deactivateInstruction = getDeactivateInstruction({
          stake: acc.address,
          stakeAuthority: createNoopSigner(address(sender)),
        });

        pipe(transactionMessage, (tx) =>
          appendTransactionMessageInstruction(deactivateInstruction, tx),
        );

        // const deactivateTx = StakeProgram.deactivate({
        //   stakePubkey: acc.pubkey,
        //   authorizedPubkey: senderPublicKey,
        // });

        // instructions.push(...deactivateTx.instructions);
      }

      return { result: transactionMessage };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  /**
   * Determins the current state of a stake account given the current epoch
   * @param currentEpoch
   * @returns `stakeAccount`'s stake state`string`
   */
  public stakeAccountState(
    account: StakeStateAccount,
    currentEpoch: bigint,
  ): string {
    //TODO check
    if (account.state.__kind !== 'Stake') {
      return StakeState.Inactive;
    }

    // const {
    //   type,
    //   info: { stake },
    // } = account.state.fields[0].authorized.data;

    // if (type !== 'delegated' || stake === null) {
    //   return StakeState.Inactive;
    // }

    const activationEpoch = account.state.fields[1].delegation.activationEpoch;
    const deactivationEpoch =
      account.state.fields[1].delegation.deactivationEpoch;

    if (activationEpoch > currentEpoch) {
      return StakeState.Inactive;
    }
    if (activationEpoch === currentEpoch) {
      // if you activate then deactivate in the same epoch,
      // deactivationEpoch === activationEpoch.
      // if you deactivate then activate again in the same epoch,
      // the deactivationEpoch will be reset to EPOCH_MAX
      if (deactivationEpoch === activationEpoch) return StakeState.Inactive;

      return StakeState.Activating;
    }
    // activationEpoch < currentEpochBN
    if (deactivationEpoch > currentEpoch) return StakeState.Active;
    if (deactivationEpoch === currentEpoch) return StakeState.Deactivating;

    return StakeState.Deactivated;
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
    authorityPublicKey: Address,
    lamports: bigint,
    oldStakeAccountPubkey: Address,
    source: string,
  ): Promise<[[IInstruction, IInstruction], Address]> {
    // Format source to
    const seed = this.formatSource(source);

    const newStakeAccountPubkey = await createAddressWithSeed({
      baseAddress: authorityPublicKey,
      programAddress: STAKE_PROGRAM_ADDRESS,
      seed,
    });

    // TODO add support split w\o seed
    const allocateWithSeedInstruction = getAllocateWithSeedInstruction({
      newAccount: newStakeAccountPubkey,
      baseAccount: createNoopSigner(address(authorityPublicKey)),
      base: authorityPublicKey,
      seed: seed,
      //TODO get from account
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    //TODO transfer
    /*
    if (rentExemptReserve && rentExemptReserve > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: params.authorizedPubkey,
          toPubkey: splitStakePubkey,
          lamports: rentExemptReserve,
        }),
      );
    }
    */

    const splitInstruction = getSplitInstruction({
      stake: oldStakeAccountPubkey,
      splitStake: newStakeAccountPubkey,
      stakeAuthority: createNoopSigner(authorityPublicKey),
      args: lamports,
    });

    return [
      [allocateWithSeedInstruction, splitInstruction],
      newStakeAccountPubkey,
    ];
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
  public async claim(sender: string): Promise<ApiResponse<ClaimResponse>> {
    try {
      const delegations = await this.getDelegations(sender);

      //     const stakeAccounts = delegations.result.map((delegationAcc) => {
      //       return {
      //         pubkey: delegationAcc.pubkey,
      //         account: new StakeAccount(delegationAcc.account),
      //       };
      //     });

      const epochInfo = await this.connection.getEpochInfo().send();
      const tm = this.timestampInSec();

      let totalClaimableStake = 0n;
      const deactivatedStakeAccounts = delegations.result.filter((acc) => {
        // const { data } = acc.account.account;

        // const stakeAmount = isStake(acc.data.state)
        //   ? acc.data.state.fields[1].delegation.stake
        //   : 0n;

        // const { info } = data;
        const isDeactivated =
          !isLockupInForce(acc.data, epochInfo.epoch, BigInt(tm)) &&
          this.stakeAccountState(acc.data, epochInfo.epoch) ===
            StakeState.Deactivated;
        if (isDeactivated) {
          totalClaimableStake += acc.lamports;
        }

        return isDeactivated;
      });

      if (deactivatedStakeAccounts.length === 0)
        throw this.throwError('NOTHING_TO_CLAIM_ERROR');

      //     let instructions = [
      //       ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
      //     ];

      const { value: finalLatestBlockhash } = await this.connection
        .getLatestBlockhash()
        .send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(address(sender), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
      );

      for (const acc of deactivatedStakeAccounts) {
        // Create the withdraw instruction
        const withdrawInstruction = getWithdrawInstruction({
          stake: acc.address,
          recipient: address(sender),
          withdrawAuthority: createNoopSigner(address(sender)),
          args: acc.lamports,
        });

        // const withdrawTx = getWithdrawInstruction({
        //   stakePubkey: acc.pubkey,
        //   authorizedPubkey: senderPublicKey,
        //   toPubkey: senderPublicKey,
        //   lamports: acc.account.account.lamports,
        // });
        // instructions.push(...withdrawTx.instructions);

        pipe(transactionMessage, (tx) =>
          appendTransactionMessageInstruction(withdrawInstruction, tx),
        );
      }

      return {
        result: {
          claimVerTx: transactionMessage,
          totalClaimAmount: totalClaimableStake,
        },
      };
    } catch (error) {
      throw this.handleError('CLAIM_ERROR', error);
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
  // private async merge(
  //   authorityPublicKey: PublicKey,
  //   stakeAccount1: PublicKey,
  //   stakeAccount2: PublicKey,
  // ) {
  //   const mergeStakeAccountTx = StakeProgram.merge({
  //     stakePubkey: stakeAccount1,
  //     sourceStakePubKey: stakeAccount2,
  //     authorizedPubkey: authorityPublicKey,
  //   });

  //   return [mergeStakeAccountTx];
  // }

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

/**
 * Check if lockup is in force
 * @param currEpoch current epoch.
 * @param currUnixTimestamp current unix timetamp.
 * @returns a bool type result.
 */
function isLockupInForce(
  account: StakeStateAccount,
  currEpoch: bigint,
  currUnixTimestamp: bigint,
): boolean {
  //TODO check
  if (account.state.__kind !== 'Stake') {
    return false;
  }

  return (
    account.state.fields[0].lockup.unixTimestamp > currUnixTimestamp ||
    account.state.fields[0].lockup.epoch > currEpoch
  );
}

function isStake(
  state: StakeStateV2,
): state is { __kind: 'Stake'; fields: readonly [Meta, Stake, StakeFlags] } {
  return state.__kind === 'Stake';
}
