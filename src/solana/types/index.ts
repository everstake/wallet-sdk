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

export type Delegation = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
};

export type CreateAccountResponse = {
  createStakeAccountVerTx: VersionedTransaction;
  stakeAccount: PublicKey;
};

export type Account = {
  pubkey: PublicKey;
  account: StakeAccount;
};

export type AccountToSplit = {
  account: Account;
  lamports: number;
};
