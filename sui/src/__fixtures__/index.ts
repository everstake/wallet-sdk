/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { ERROR_MESSAGES } from '../constants/error';

export const selectNetworkSuccessFixture = [
  {
    description: 'should initialize "mainnet" network',
    args: {
      network: 'mainnet',
    },
    result: {
      validatorAddress:
        '0xbba318294a51ddeafa50c335c8e77202170e1f272599a2edc40592100863f638',
    },
  },
  {
    description: 'should initialize "testnet" network',
    args: {
      network: 'testnet',
    },
    result: {
      validatorAddress:
        '0x155d5e5f1904db5f3a16924d0211b4c34cfcc947f345a1deff1452fc5373fed4',
    },
  },
];

export const selectNetworErrorkFixture = [
  {
    description: 'should throw "NETWORK_NOT_SUPPORTED" error',
    args: {
      network: 'fakenet',
    },
    error: ERROR_MESSAGES.NETWORK_NOT_SUPPORTED,
  },
];

export const stakeAmount = [
  {
    description: 'amount is less than SUI_MIN_AMOUNT_FOR_STAKE',
    args: {
      amount: '0.5',
    },
    error: {
      message: ERROR_MESSAGES.MIN_STAKE_AMOUNT_ERROR,
      code: 'MIN_STAKE_AMOUNT_ERROR',
    },
  },
  {
    description: 'amount is equal to SUI_MIN_AMOUNT_FOR_STAKE',
    args: {
      amount: '1',
    },
    error: {},
  },
  {
    description: 'amount is greater than SUI_MIN_AMOUNT_FOR_STAKE',
    args: {
      amount: '2',
    },
    error: {},
  },
];

export const invalidGetStakeBalanceAddress = [
  {
    description: 'address is invalid',
    args: {
      address: 'not hex encoded address',
    },
    error: ERROR_MESSAGES.ADDRESS_FORMAT_ERROR,
  },
];
