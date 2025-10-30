/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type NetworkType = 'eth_mainnet';

export interface EthNetworkAddresses {
  issuanceVaultAddress: string;
  redemptionVaultAddress: string;
  oracleAddress: string;
  tokenAddress: string;

  rpcUrl: string;
}

export type NetworksMap = {
  [K in NetworkType]: EthNetworkAddresses;
};

export type EthTransaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};
