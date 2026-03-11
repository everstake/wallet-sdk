/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type VaultType = 'mainnet' | 'hoodi';

export interface VaultAddresses {
  // poolType = StvStrategyPool
  addressStrategy: string;
  addressOracle: string; // lazyOracle
  addressPool: string;
  addressLido: string; // v3
  addressVaultHub: string;
  rpcUrl: string;
}

export type VaultAddressesMap = Record<VaultType, VaultAddresses>;

export type EthTransaction = {
  from: string;
  to: string;
  value: bigint;
  gasLimit: number;
  data: string;
};

export type BalanceData = {
  totalUserValueInEth: string;

}

export type ReportData = {
  timestamp: bigint;
  refSlot: bigint;
  treeRoot: string;
  reportCid: string;
}

export interface PendingDepositRequest {
  assets: string;
  timestamp: string;
  isClaimable: boolean;
}
