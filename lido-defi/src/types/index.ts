/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type VaultType = 'mainnet' | 'hoodi';

export interface VaultAddresses {
  // poolType = StvStrategyPool
  addressVault: string;
  addressOracle: string; // lazyOracle
  addressWrapper: string;
  addressPool: string;
  addressLido: string; // v3
  addressVaultHub: string;
  addressDepositQueue: string;
  addressRedeemQueue: string;
  addressShareManager: string;
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
  proxyUnlockedBalanceEth: string; // processable withdrawal requests to stVault
  totalUserValueInEth: string; // user vault balance
  processableEth: string; // totalEthToWithdrawFromProxy
  availableEth: string; // eth available for withdrawal
  pendingEth: string; // sum of eth in pending withdrawal requests
  pendingDepositsEth: string; // ETH locked for pending async deposits into strategy vault
  assetShortfallInEth: string; // ETH missing from locked to cover total liability (0 if healthy)
};

export type ReportData = {
  timestamp: bigint;
  refSlot: bigint;
  treeRoot: string;
  reportCid: string;
};

export interface PendingDepositRequest {
  assets: string;
  timestamp: string;
  isClaimable: boolean;
}
