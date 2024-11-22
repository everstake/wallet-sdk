// Copied from https://github.com/igneous-labs/solana-stake-sdk
import { PublicKey } from '@solana/web3.js';
import {
  coerce,
  Infer,
  instance,
  nullable,
  number,
  string,
  type,
} from 'superstruct';
import BigNumber from 'bignumber.js';
import { StakeAccountType } from '../constants';
export const BigNumFromString = coerce(
  instance(BigNumber),
  string(),
  (value) => {
    if (typeof value === 'string') return new BigNumber(value, 10);
    throw new Error('invalid big num');
  },
);

export const PublicKeyFromString = coerce(
  instance(PublicKey),
  string(),
  (value) => new PublicKey(value),
);

export type StakeMeta = Infer<typeof StakeMeta>;
export const StakeMeta = type({
  rentExemptReserve: BigNumFromString,
  authorized: type({
    staker: PublicKeyFromString,
    withdrawer: PublicKeyFromString,
  }),
  lockup: type({
    unixTimestamp: number(),
    epoch: number(),
    custodian: PublicKeyFromString,
  }),
});

export const StakeAccountInfo = type({
  meta: StakeMeta,
  stake: nullable(
    type({
      delegation: type({
        voter: PublicKeyFromString,
        stake: BigNumFromString,
        activationEpoch: BigNumFromString,
        deactivationEpoch: BigNumFromString,
        warmupCooldownRate: number(),
      }),
      creditsObserved: number(),
    }),
  ),
});

export type StakeAccount = Infer<typeof StakeAccount>;
export const StakeAccount = type({
  type: StakeAccountType,
  info: StakeAccountInfo,
});
