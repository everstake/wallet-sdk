export type Network = 'testnet';

export type Transaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};
