// copied from https://github.com/solana-labs/solana/blob/master/explorer/src/validators/accounts/stake.ts

/* eslint-disable @typescript-eslint/no-redeclare */
const { PublicKey /*, ParsedAccountData, AccountInfo*/ } = require("@solana/web3.js");
const { enums, nullable, number, type, coerce, instance, string, create /*Infer*/ } = require("superstruct");
const BigNumber = require('bignumber.js');

const StakeState = {
	Inactive: "inactive",
	Activating: "activating",
	Active: "active",
	Deactivating: "deactivating",
  Deactivated: "deactivated"
}

const BigNumFromString = coerce(instance(BigNumber), string(), (value) => {
    if (typeof value === "string") return new BigNumber(value, 10);
    throw new Error("invalid big num");
  });

const PublicKeyFromString = coerce(
    instance(PublicKey),
    string(),
    (value) => new PublicKey(value),
  );

// type StakeAccountType = Infer<typeof StakeAccountType>;
const StakeAccountType = enums([
  "uninitialized",
  "initialized",
  "delegated",
  "rewardsPool",
]);

// type StakeMeta = Infer<typeof StakeMeta>;
const StakeMeta = type({
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

// type StakeAccountInfo = Infer<typeof StakeAccountInfo>;
const StakeAccountInfo = type({
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

// type StakeAccount = Infer<typeof StakeAccount>;
const StakeAccount = type({
  type: StakeAccountType,
  info: StakeAccountInfo,
});

  
function isLockupInForce(
    meta,
    currEpoch,
    currUnixTimestamp,
) {
    return (
      meta.lockup.unixTimestamp > currUnixTimestamp ||
      meta.lockup.epoch > currEpoch
    );
}

/**
 * Converts an `AccountInfo<ParsedAccountData>` to an `AccountInfo<StakeAccount>`
 * @param account raw accountinfo returned by getParsedProgramAccounts or getParsedAccountInfo
 * @returns the parsed StakeAccount
 * @throws ParseStakeAccountError if `account` is AccountInfo<Buffer> or if unable to parse account data
 */
function parsedAccountInfoToStakeAccount({
    executable,
    owner,
    lamports,
    data,
    rentEpoch,
  }) {
    // : AccountInfo<Buffer | ParsedAccountData>
    // return : AccountInfo<StakeAccount>
    if (!("parsed" in data)) {
      throw new ParseStakeAccountError(
        "Raw AccountInfo<Buffer>, data not parsed",
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
    } catch (error) {
        throw new Error(error);
    }
  }

/**
 * Determins the current state of a stake account given the current epoch
 * @param stakeAccount
 * @param currentEpoch
 * @returns `stakeAccount`'s `StakeState`
 */
function stakeAccountState(
    { type, info: { stake } },
    currentEpoch,
  ) {
    if (type !== "delegated" || stake === null) {
      return StakeState.Inactive;
    }
    
    const activationEpoch = new BigNumber(stake.delegation.activationEpoch);
    const deactivationEpoch = new BigNumber(stake.delegation.deactivationEpoch);
    currentEpoch = new BigNumber(currentEpoch);

    if (activationEpoch.gt(currentEpoch)) {
      return StakeState.Inactive;
    }

    if (activationEpoch.eq(currentEpoch)) {
      // if you activate then deactivate in the same epoch,
      // deactivationEpoch === activationEpoch.
      // if you deactivate then activate again in the same epoch,
      // the deactivationEpoch will be reset to EPOCH_MAX
      if (deactivationEpoch.eq(activationEpoch)) return StakeState.Inactive;
      return StakeState.Activating;
    }

    // activationEpoch < currentEpoch
    if (deactivationEpoch.gt(currentEpoch)) return StakeState.Active;
    if (deactivationEpoch.eq(currentEpoch)) return  StakeState.Deactivating;

    return StakeState.Deactivated;
}

module.exports = {
    StakeAccount,
    StakeAccountType,
    StakeState,
    isLockupInForce,
    parsedAccountInfoToStakeAccount,
    stakeAccountState
};