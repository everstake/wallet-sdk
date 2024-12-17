export type EthNetworkType = 'mainnet' | 'holesky';

export interface EthNetworkAddresses {
  addressContractAccounting: string;
  addressContractPool: string;
  addressContractWithdrawTreasury: string;
  rpcUrl: string;
}

export type EthNetworkAddressesMap = {
  [K in EthNetworkType]: EthNetworkAddresses;
};

export type EthTransaction = {
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

export interface AggregatedBalances {
  [key: string]: string;
}

export type PoolBalances = {
  balance: string;
  pendingBalance: string;
  pendingDepositedBalance: string;
  pendingRestakedRewards: string;
  readyforAutocompoundRewardsAmount: string;
};

export type UserBalances = {
  pendingBalanceOf: string;
  pendingDepositedBalanceOf: string;
  pendingRestakedRewardOf: string;
  autocompoundBalanceOf: string;
  depositedBalanceOf: string;
};
