export type NetworkType = 'mainnet' | 'holesky';

export interface NetworkAddresses {
  addressContractAccounting: string;
  addressContractPool: string;
  addressContractWithdrawTreasury: string;
  rpcUrl: string;
}

export type NetworkAddressesMap = {
  [K in NetworkType]: NetworkAddresses;
};

export type Transaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};

export enum ValidatorStatus {
  Unknown = 0,
  Pending = 1,
  Deposited = 2,
}
