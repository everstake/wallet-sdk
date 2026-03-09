/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type VaultType = 'mainnet' | 'hoodi';

export interface VaultAddresses {
  // poolType = StvStrategyPool
  addressStrategy: string;
  addressPool: string;
  addressLido: string; // v3
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

export interface PendingDepositRequest {
  assets: string;
  timestamp: string;
  isClaimable: boolean;
}
