/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export const ERROR_MESSAGES = {
  BALANCE_ERROR: 'An error occurred while getting the balance',
  PENDING_BALANCE_ERROR: 'An error occurred while getting the pending balance',
  PENDING_DEPOSITED_BALANCE_ERROR:
    'An error occurred while getting the pending deposited balance',
  PENDING_RESTAKED_REWARDS_ERROR:
    'An error occurred while getting the pending restaked rewards',
  READY_FOR_AUTOCOMPOUND_REWARDS_AMOUNT_ERROR:
    'An error occurred while getting the ready for autocompound rewards amount',
  PENDING_BALANCE_OF_ERROR:
    'An error occurred while getting the pending balance of an address',
  PENDING_DEPOSITED_BALANCE_OF_ERROR:
    'An error occurred while getting the pending deposited balance of an address',
  DEPOSITED_BALANCE_OF_ERROR:
    'An error occurred while getting the deposited balance of an address',
  PENDING_RESTAKED_REWARD_OF_ERROR:
    'An error occurred while getting the pending restaked reward of an address',
  RESTAKED_REWARD_OF_ERROR:
    'An error occurred while getting the restaked reward of an address',
  GET_POOL_FEE_ERROR: 'An error occurred while getting the pool fee',
  MIN_STAKE_AMOUNT_ERROR:
    'An error occurred while getting the minimum stake amount',
  GET_VALIDATOR_ERROR: 'An error occurred while getting the validator',
  GET_VALIDATOR_COUNT_ERROR:
    'An error occurred while getting the validator count',
  GET_PENDING_VALIDATOR_ERROR:
    'An error occurred while getting the pending validator',
  GET_PENDING_VALIDATOR_COUNT_ERROR:
    'An error occurred while getting the pending validator count',
  ACTIVATE_STAKE_ERROR: 'An error occurred while activating the stake',
  MIN_AMOUNT_ERROR: 'Min Amount {0} wei',
  UNSTAKE_PENDING_ERROR: 'An error occurred while unstaking the pending amount',
  INSUFFICIENT_PENDING_BALANCE_ERROR: `Pending balance less than min stake amount {0}`,
  ZERO_UNSTAKE_MESSAGE: 'Zero pending balance',
  AMOUNT_GREATER_THAN_PENDING_BALANCE_ERROR: `Amount greater than pending balance {0}`,
  NETWORK_NOT_SUPPORTED: `Unsupported network {0}`,
  NO_REWARDS_MESSAGE: 'No active rewards for claim',
  AUTOCOMPOUND_ERROR:
    'An error occurred while performing the autocompound operation',
  AUTOCOMPOUND_BALANCE_OF_ERROR:
    'An error occurred while getting the autocompound balance of an address',
  WITHDRAW_REQUEST_QUEUE_PARAMS_ERROR:
    'An error occurred while getting the withdraw request queue parameters',
  WITHDRAW_REQUEST_ERROR:
    'An error occurred while getting the withdraw request info for an address',
  ZERO_UNSTAKE_ERROR: 'No amount requested for unstake',
  NOT_FILLED_UNSTAKE_MESSAGE: 'Unstake request not filled yet',
  WRONG_TYPE_MESSAGE: 'Wrong input type',
  CLAIM_WITHDRAW_REQUEST_ERROR:
    'An error occurred while claiming the withdraw request for an address',
  CLOSE_VALIDATORS_STAT_ERROR:
    'An error occurred while getting the number of validators expected to stop',
  STAKE_ERROR: 'An error occurred while staking funds into the pool',
  UNSTAKE_ERROR: 'An error occurred while unstaking funds from the pool',
  SIMULATE_UNSTAKE_ERROR:
    'An error occurred while simulating the unstake transaction',
  MAX_AMOUNT_FOR_UNSTAKE_ERROR: 'Max Amount For Unstake {0}',
  ADDRESS_FORMAT_ERROR: 'Invalid Ethereum address format',
  USER_BALANCES_ERROR: 'An error occurred while getting the user balances',
  POOL_BALANCES_ERROR: 'An error occurred while getting the pool balances',
};

export const ORIGINAL_ERROR_MESSAGES = {
  'InvalidValue: remainder':
    'The remainder is less than the minimum stake amount.',
  'InvalidValue: amount': `The requested amount is greater than the pool's pending balance.`,
  'InvalidValue: pending balance':
    'The user has no pending balance or it is less than the requested amount.',
  'ZeroValue: pending': `The pool's pending balance is zero.`,
  'ZeroValue: claim': 'There is nothing to claim.',
  'InvalidParam: index': 'The provided index is out of range.',
  'InvalidParam: caller': 'This action is not allowed for the current user.',
  'InvalidValue: zero amount': 'There is nothing to activate.',
  'InvalidValue: share': 'The requested amount is less than one share.',
  'InvalidValue: withdrawable balance':
    'The requested amount is greater than the active balance.',
  'Paused: withdraw claim': 'Claiming unstake is currently paused.',
  'Paused: staking': 'Staking is currently paused.',
  'Paused: withdraw': 'Unstaking is currently paused.',
  'InvalidAmount: small stake':
    'The staked amount is less than the minimum stake amount.',
  'Pending validator': 'There are not enough pending validators to activate.',
  'Returned error: execution reverted':
    'The operation failed. Please try again.',
};
