/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { PublicKey } from '@solana/web3.js';
import { enums } from 'superstruct';

export const SOL_CHAIN = 'solana';
export const SOL_MIN_AMOUNT = 10000000; // 0.01 SOL
export const SOL_MAINNET_VALIDATOR_ADDRESS = new PublicKey(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);
export const SOL_DEVNET_VALIDATOR_ADDRESS = new PublicKey(
  'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
);
export const FILTER_DATA_SIZE = 200;
export const FILTER_OFFSET = 44;

export enum SolNetwork {
  Mainnet = 'mainnet-beta',
  Devnet = 'devnet',
}

export const StakeState = {
  inactive: 'inactive',
  activating: 'activating',
  active: 'active',
  deactivating: 'deactivating',
  deactivated: 'deactivated',
};

export const StakeAccountType = enums([
  'uninitialized',
  'initialized',
  'delegated',
  'rewardsPool',
]);
