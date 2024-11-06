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

export type ValidatorStatus = 'unknown' | 'pending' | 'deposited';

export type ValidatorCode = '0' | '1' | string;
