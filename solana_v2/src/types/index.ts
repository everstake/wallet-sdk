import {
  Address,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';

export interface ApiResponse<T> {
  result: T;
}

export type CreateAccountResponse = {
  transaction: TransactionMessageWithBlockhashLifetime;
  stakeAccount: Address;
};

export type StakeResponse = CreateAccountResponse;

export type ClaimResponse = {
  claimVerTx: TransactionMessageWithBlockhashLifetime;
  totalClaimAmount: bigint;
};
