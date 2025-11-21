/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { address, Address } from '@solana/kit';

export type SupportedToken = 'USDC';

export type VaultsMap = {
  [K in SupportedToken]: Address;
};

export const VAULTS: VaultsMap = {
  // Gauntlet USDC Prime
  USDC: address('9E69U4GzWhryRaPe8DYpco6Z9vTZY6gg8w6W2QsBACEj'),
};

export * from './errors';
