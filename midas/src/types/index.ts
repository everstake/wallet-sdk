/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type NetworkType = 'eth_mainnet';

export interface EthNetworkAddresses {
  rpcUrl: string;
}

export type NetworksMap = {
  [K in NetworkType]: EthNetworkAddresses;
};

export type MidasVaultType = 'mmev';

export interface MidasVaultAddresses {
  issuanceVaultAddress: string;
  redemptionVaultAddress: string;
  oracleAddress: string;
  tokenAddress: string;
  
  Network: NetworkType;
}

export type MidasVaultsMap = {
  [K in MidasVaultType]: MidasVaultAddresses;
}

export type EthTransaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};