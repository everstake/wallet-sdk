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
  'USDC': address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'),
};

export * from './errors';