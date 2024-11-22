import { PublicKey } from '@solana/web3.js';
import { enums } from 'superstruct';

export const CHAIN = 'solana';
export const MIN_AMOUNT = 10000000; // 0.01 SOL
export const MAINNET_VALIDATOR_ADDRESS = new PublicKey(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);
export const DEVNET_VALIDATOR_ADDRESS = new PublicKey(
  'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
);
export const FILTER_DATA_SIZE = 200;
export const FILTER_OFFSET = 44;

export enum Network {
  Mainnet = 'mainnet-beta',
  Devnet = 'devnet',
}

export const StakeState = {
  Inactive: 'inactive',
  Activating: 'activating',
  Active: 'active',
  Deactivating: 'deactivating',
  Deactivated: 'deactivated',
};

export const StakeAccountType = enums([
  'uninitialized',
  'initialized',
  'delegated',
  'rewardsPool',
]);
