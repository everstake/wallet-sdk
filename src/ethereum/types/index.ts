/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

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
