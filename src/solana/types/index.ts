import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';
import { StakeAccount } from '../stakeAccount';

export interface ApiResponse<T> {
  result: T;
}

export type SolDelegation = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
};

export type SolCreateAccountResponse = {
  createStakeAccountVerTx: VersionedTransaction;
  stakeAccount: PublicKey;
};

export type SolAccount = {
  pubkey: PublicKey;
  account: StakeAccount;
};

export type SolAccountToSplit = {
  account: SolAccount;
  lamports: number;
};