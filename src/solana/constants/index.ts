import { address } from '@solana/web3.js';

export const CHAIN = 'solana';
export const MIN_AMOUNT = 10000000; // 0.01 SOL
export const MAINNET_VALIDATOR_ADDRESS = address(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);
export const DEVNET_VALIDATOR_ADDRESS = address(
  'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
);
export const FILTER_DATA_SIZE = 200n;
export const FILTER_OFFSET = 44n;

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
