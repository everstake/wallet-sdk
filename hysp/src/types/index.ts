/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

export type { BigNumber };

export type NetworkType = 'eth_mainnet' | 'base';

export type APYRange = 'weekly' | 'monthly';

export interface EthNetworkAddresses {
  issuanceVaultAddress: string;
  redemptionVaultAddress: string;
  oracleAddress: string;
  tokenAddress: string;
  tBillAddress: string;
  tBillDataFeed: string;
  lpAddress: string;
  usdcAddress: string;

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

export interface RedeemRequestInfo {
  requestId: bigint;
  sender: string;
  tokenOut: string;
  amountMToken: BigNumber;
  feeAmount: BigNumber;
  status: string;
  mTokenRate: BigNumber;
  tokenOutRate: BigNumber;
}
