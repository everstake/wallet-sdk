/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

// @everstake/wallet-sdk is deprecated for chain-specific functionality.
// The Solana implementation formerly here has been removed in favor of
// the maintained, actively published @everstake/wallet-sdk-solana package
// (and the other per-chain @everstake/wallet-sdk-* packages).
//
// This package now only re-exports the shared, chain-agnostic API helpers
// below, which have no blockchain SDK dependency of their own.
export * from '../utils';
export * from '../utils/api';
