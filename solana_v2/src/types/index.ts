import { StakeStateAccount } from '@solana-program/stake';
import {
  Account,
  Address,
  CompilableTransactionMessage,
  Transaction,
  TransactionMessageWithBlockhashLifetime,
} from '@solana/web3.js';

export interface ApiResponse<T> {
  result: T;
}

export type CreateAccountResponse = {
  transaction:
    | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
    | (Transaction & TransactionMessageWithBlockhashLifetime);
  stakeAccount: Address;
};

export type StakeResponse = {
  stakeTx:
    | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
    | (Transaction & TransactionMessageWithBlockhashLifetime);
  stakeAccount: Address;
};

export type UnstakeResponse = {
  unstakeTx: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime;
};

export type ClaimResponse = {
  claimTx: CompilableTransactionMessage &
    TransactionMessageWithBlockhashLifetime;
  totalClaimAmount: bigint;
};

export type Delegations = Array<Account<StakeStateAccount, Address>>;
