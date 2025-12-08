/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type NetworkType = 'eth_mainnet' | 'base';

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

export interface ShareToken {
  address: string;
  symbol: string;
  decimals: number;
}

export interface VaultContracts {
  depositVault: string;
  redemptionVault: string;
  priceFeed: string;
}

export interface VaultMeta {
  network: NetworkType;
  vaultKey: string;
  shareToken: ShareToken;
  contracts: VaultContracts;
}
