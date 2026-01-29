/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { address, Address } from '@solana/kit';

export type SupportedToken = 'USDC';

export interface VaultInfo {
  address: Address;
  shareTokenAddress: Address;
  shareTokenSymbol: string;
  shareTokenDecimals: number;
}

export type VaultsMap = {
  [K in SupportedToken]: VaultInfo;
};

export const VAULTS: VaultsMap = {
  // Gauntlet USDC Prime
  USDC: {
    address: address('HptboyAsrs3xPQUMDT31gHLW3tzrq6p6As56EK7VXMcL'),
    shareTokenAddress: address('32XLsweyeQwWgLKRVAzS72nxHGU1JmmNQQZ3C3q6fBjJ'),
    shareTokenSymbol: 'Kamino Reserve Collateral (USDC) Token',
    shareTokenDecimals: 6,
  },
};

export const MAX_TRANSACTION_SIZE = 1232;

export * from './errors';
