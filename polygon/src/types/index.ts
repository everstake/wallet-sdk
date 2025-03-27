import BigNumber from 'bignumber.js';

export type TransactionRequest = {
  from: string;
  to: string;
  gasLimit: bigint;
  data: string;
};

export type UnbondInfo = {
  amount: BigNumber;
  withdrawEpoch: bigint;
  unbondNonces: bigint;
};
