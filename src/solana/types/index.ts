import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';

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

export enum Network {
  Mainnet = 'mainnet-beta',
  Devnet = 'devnet',
}
