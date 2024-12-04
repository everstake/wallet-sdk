/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  isProgramError,
  type Address,
  type SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  type SolanaError,
} from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '../programs';

export const STAKE_ERROR__NO_CREDITS_TO_REDEEM = 0x0; // 0

export const STAKE_ERROR__LOCKUP_IN_FORCE = 0x1; // 1

export const STAKE_ERROR__ALREADY_DEACTIVATED = 0x2; // 2

export const STAKE_ERROR__TOO_SOON_TO_REDELEGATE = 0x3; // 3

export const STAKE_ERROR__INSUFFICIENT_STAKE = 0x4; // 4

export const STAKE_ERROR__MERGE_TRANSIENT_STAKE = 0x5; // 5

export const STAKE_ERROR__MERGE_MISMATCH = 0x6; // 6

export const STAKE_ERROR__CUSTODIAN_MISSING = 0x7; // 7

export const STAKE_ERROR__CUSTODIAN_SIGNATURE_MISSING = 0x8; // 8

export const STAKE_ERROR__INSUFFICIENT_REFERENCE_VOTES = 0x9; // 9

export const STAKE_ERROR__VOTE_ADDRESS_MISMATCH = 0xa; // 10

export const STAKE_ERROR__MINIMUM_DELINQUENT_EPOCHS_FOR_DEACTIVATION_NOT_MET = 0xb; // 11

export const STAKE_ERROR__INSUFFICIENT_DELEGATION = 0xc; // 12

export const STAKE_ERROR__REDELEGATE_TRANSIENT_OR_INACTIVE_STAKE = 0xd; // 13

export const STAKE_ERROR__REDELEGATE_TO_SAME_VOTE_ACCOUNT = 0xe; // 14

export const STAKE_ERROR__REDELEGATED_STAKE_MUST_FULLY_ACTIVATE_BEFORE_DEACTIVATION_IS_PERMITTED = 0xf; // 15

export const STAKE_ERROR__EPOCH_REWARDS_ACTIVE = 0x10; // 16

export type StakeError =
  | typeof STAKE_ERROR__ALREADY_DEACTIVATED
  | typeof STAKE_ERROR__CUSTODIAN_MISSING
  | typeof STAKE_ERROR__CUSTODIAN_SIGNATURE_MISSING
  | typeof STAKE_ERROR__EPOCH_REWARDS_ACTIVE
  | typeof STAKE_ERROR__INSUFFICIENT_DELEGATION
  | typeof STAKE_ERROR__INSUFFICIENT_REFERENCE_VOTES
  | typeof STAKE_ERROR__INSUFFICIENT_STAKE
  | typeof STAKE_ERROR__LOCKUP_IN_FORCE
  | typeof STAKE_ERROR__MERGE_MISMATCH
  | typeof STAKE_ERROR__MERGE_TRANSIENT_STAKE
  | typeof STAKE_ERROR__MINIMUM_DELINQUENT_EPOCHS_FOR_DEACTIVATION_NOT_MET
  | typeof STAKE_ERROR__NO_CREDITS_TO_REDEEM
  | typeof STAKE_ERROR__REDELEGATED_STAKE_MUST_FULLY_ACTIVATE_BEFORE_DEACTIVATION_IS_PERMITTED
  | typeof STAKE_ERROR__REDELEGATE_TO_SAME_VOTE_ACCOUNT
  | typeof STAKE_ERROR__REDELEGATE_TRANSIENT_OR_INACTIVE_STAKE
  | typeof STAKE_ERROR__TOO_SOON_TO_REDELEGATE
  | typeof STAKE_ERROR__VOTE_ADDRESS_MISMATCH;

let stakeErrorMessages: Record<StakeError, string> | undefined;
if (process.env.NODE_ENV !== 'production') {
  stakeErrorMessages = {
    [STAKE_ERROR__ALREADY_DEACTIVATED]: `Stake already deactivated`,
    [STAKE_ERROR__CUSTODIAN_MISSING]: `Custodian address not present`,
    [STAKE_ERROR__CUSTODIAN_SIGNATURE_MISSING]: `Custodian signature not present`,
    [STAKE_ERROR__EPOCH_REWARDS_ACTIVE]: `Stake action is not permitted while the epoch rewards period is active`,
    [STAKE_ERROR__INSUFFICIENT_DELEGATION]: `Delegation amount is less than the minimum`,
    [STAKE_ERROR__INSUFFICIENT_REFERENCE_VOTES]: `Insufficient voting activity in the reference vote account`,
    [STAKE_ERROR__INSUFFICIENT_STAKE]: `Split amount is more than is staked`,
    [STAKE_ERROR__LOCKUP_IN_FORCE]: `Lockup has not yet expired`,
    [STAKE_ERROR__MERGE_MISMATCH]: `Stake account merge failed due to different authority, lockups or state`,
    [STAKE_ERROR__MERGE_TRANSIENT_STAKE]: `Stake account with transient stake cannot be merged`,
    [STAKE_ERROR__MINIMUM_DELINQUENT_EPOCHS_FOR_DEACTIVATION_NOT_MET]: `Stake account has not been delinquent for the minimum epochs required for deactivation`,
    [STAKE_ERROR__NO_CREDITS_TO_REDEEM]: `Not enough credits to redeem`,
    [STAKE_ERROR__REDELEGATED_STAKE_MUST_FULLY_ACTIVATE_BEFORE_DEACTIVATION_IS_PERMITTED]: `Redelegated stake must be fully activated before deactivation`,
    [STAKE_ERROR__REDELEGATE_TO_SAME_VOTE_ACCOUNT]: `Stake redelegation to the same vote account is not permitted`,
    [STAKE_ERROR__REDELEGATE_TRANSIENT_OR_INACTIVE_STAKE]: `Stake account with transient or inactive stake cannot be redelegated`,
    [STAKE_ERROR__TOO_SOON_TO_REDELEGATE]: `One re-delegation permitted per epoch`,
    [STAKE_ERROR__VOTE_ADDRESS_MISMATCH]: `Stake account is not delegated to the provided vote account`,
  };
}

export function getStakeErrorMessage(code: StakeError): string {
  if (process.env.NODE_ENV !== 'production') {
    return (stakeErrorMessages as Record<StakeError, string>)[code];
  }

  return 'Error message not available in production bundles.';
}

export function isStakeError<TProgramErrorCode extends StakeError>(
  error: unknown,
  transactionMessage: {
    instructions: Record<number, { programAddress: Address }>;
  },
  code?: TProgramErrorCode,
): error is SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM> &
  Readonly<{ context: Readonly<{ code: TProgramErrorCode }> }> {
  return isProgramError<TProgramErrorCode>(
    error,
    transactionMessage,
    STAKE_PROGRAM_ADDRESS,
    code,
  );
}
