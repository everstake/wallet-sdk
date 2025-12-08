/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Blockhash, Instruction } from '@solana/kit';

export interface ApiResponse<T> {
  result: T;
}

export type Params = {
  сomputeUnitPrice?: bigint;
  computeUnitLimit?: number;
  finalLatestBlockhash?: {
    /** a Hash as base-58 encoded string */
    blockhash: Blockhash;
    /** last block height at which the blockhash will be valid */
    lastValidBlockHeight: bigint;
  };
  /** Instructions to be added after the main instructions  created by SDK */
  afterInstructions?: Instruction[];
};

export interface ShareToken {
  address: string;
  symbol: string;
  decimals: number;
}

export interface VaultContracts {
  vault: string;
}

export interface VaultMeta {
  network: 'solana_mainnet';
  vaultKey: string;
  shareToken: ShareToken;
  contracts: VaultContracts;
}
