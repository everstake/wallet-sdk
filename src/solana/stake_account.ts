// Copied from https://github.com/igneous-labs/solana-stake-sdk
import { AccountInfo, PublicKey, ParsedAccountData } from '@solana/web3.js';
import {
  coerce,
  create,
  enums,
  Infer,
  instance,
  nullable,
  number,
  string,
  type,
} from 'superstruct';
import BigNumber from 'bignumber.js';

export const PublicKeyFromString = coerce(
  instance(PublicKey),
  string(),
  (value) => new PublicKey(value),
);

export class ParseStakeAccountError extends Error {}

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

export const BigNumFromString = coerce(
  instance(BigNumber),
  string(),
  (value) => {
    if (typeof value === 'string') return new BigNumber(value, 10);
    throw new Error('invalid big num');
  },
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

export type StakeAccountInfo = Infer<typeof StakeAccountInfo>;
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

/**
 * Converts an `AccountInfo<ParsedAccountData>` to an `AccountInfo<StakeAccount>`
 * @param account raw accountinfo returned by getParsedProgramAccounts or getParsedAccountInfo
 * @returns the parsed StakeAccount
 * @throws ParseStakeAccountError if `account` is AccountInfo<Buffer> or if unable to parse account data
 */
export function parsedAccountInfoToStakeAccount({
  executable,
  owner,
  lamports,
  data,
  rentEpoch,
}: AccountInfo<Buffer | ParsedAccountData>): AccountInfo<StakeAccount> {
  if (!('parsed' in data)) {
    throw new ParseStakeAccountError(
      'Raw AccountInfo<Buffer>, data not parsed',
    );
  }
  try {
    return {
      executable,
      owner,
      lamports,
      data: create(data.parsed, StakeAccount),
      rentEpoch,
    };
  } catch (e) {
    throw new ParseStakeAccountError((e as Error).message);
  }
}

export function isLockupInForce(
  meta: StakeMeta,
  currEpoch: number,
  currUnixTimestamp: number,
): boolean {
  return (
    meta.lockup.unixTimestamp > currUnixTimestamp ||
    meta.lockup.epoch > currEpoch
  );
}

/**
 * Determins the current state of a stake account given the current epoch
 * @param stakeAccount
 * @param currentEpoch
 * @returns `stakeAccount`'s stake state`string`
 */
export function stakeAccountState(
  { type, info: { stake } }: StakeAccount,
  currentEpoch: number,
): string {
  if (type !== 'delegated' || stake === null) {
    return 'inactive';
  }
  const currentEpochBN = new BigNumber(currentEpoch);

  const activationEpoch = new BigNumber(stake.delegation.activationEpoch);
  const deactivationEpoch = new BigNumber(stake.delegation.deactivationEpoch);

  if (activationEpoch.gt(currentEpochBN)) {
    return 'inactive';
  }
  if (activationEpoch.eq(currentEpochBN)) {
    // if you activate then deactivate in the same epoch,
    // deactivationEpoch === activationEpoch.
    // if you deactivate then activate again in the same epoch,
    // the deactivationEpoch will be reset to EPOCH_MAX
    if (deactivationEpoch.eq(activationEpoch)) return 'inactive';

    return 'activating';
  }
  // activationEpoch < currentEpochBN
  if (deactivationEpoch.gt(currentEpochBN)) return 'active';
  if (deactivationEpoch.eq(currentEpochBN)) return 'deactivating';

  return 'inactive';
}
