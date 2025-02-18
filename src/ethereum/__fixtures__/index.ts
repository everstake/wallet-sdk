/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export const selectNetworkSuccessFixture = [
  {
    description: 'should initialize "mainnet" network',
    args: {
      network: 'mainnet',
    },
    result: {
      addressContractPool: '0xD523794C879D9eC028960a231F866758e405bE34',
      addressContractAccounting: '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e',
      addressContractWithdrawTreasury:
        '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
    },
  },
];

export const selectNetworErrorkFixture = [
  {
    description: 'should throw "NETWORK_NOT_SUPPORTED" error',
    args: {
      network: 'fakenet',
    },
    error: 'Unsupported network fakenet',
  },
];

export const unstakePendingSuccessFixture = [
  {
    description: 'should create a transaction for unstaking pending balance',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 1,
    },
    mockPendingBalance: '5',
    mockMinStakeAmount: '2',
    mockContractPool: {
      estimateGas: 1000,
      encodeABI: 'MockedABI',
    },
    result: {
      from: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      value: 0,
      to: '0xD523794C879D9eC028960a231F866758e405bE34',
      gasLimit: 221000,
      data: 'MockedABI',
    },
  },
];

export const unstakePendingErrorFixture = [
  {
    description:
      'should throw "ADDRESS_FORMAT_ERROR" if address is not correct',
    args: {
      network: 'mainnet',
      address: 'invalid_address',
      amount: 1,
    },
    error: 'Invalid Ethereum address format',
  },
  {
    description:
      'should throw "ZERO_UNSTAKE_MESSAGE" if pending balance is zero',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 1,
    },
    mockPendingBalance: '0',
    error: 'Zero pending balance',
  },
  {
    description:
      'should throw "AMOUNT_GREATER_THAN_PENDING_BALANCE_ERROR" if amount is greater than pending balance',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 2, // greater than pending balance
    },
    mockPendingBalance: '1',
    error: 'Amount greater than pending balance 1',
  },
  {
    description:
      'should throw "INSUFFICIENT_PENDING_BALANCE_ERROR" if pending balance is less than min stake after unstaking',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 1,
    },
    mockPendingBalance: '3', // 3 - 1 less than min stake amount
    mockMinStakeAmount: '5',
    error: 'Pending balance less than min stake amount 5',
  },
  {
    description:
      'should throw "UNSTAKE_PENDING_ERROR" if pending balance or stake amount fails',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 1,
    },
    mockPendingBalance: undefined,
    mockMinStakeAmount: undefined,
    error: 'An error occurred while unstaking the pending amount',
  },
];

export const claimWithdrawRequestSuccessFixture = [
  {
    description:
      'should return a transaction object when claimWithdrawRequest is successful',
    args: {
      network: 'holesky',
      address: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
    },
    result: {
      from: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
      to: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
      value: 0,
      data: '0x33986ffa',
    },
  },
];

export const claimWithdrawRequestErrorFixture = [
  {
    description:
      'should throw "ADDRESS_FORMAT_ERROR" if address is not correct',
    args: {
      network: 'mainnet',
      address: 'invalid_address',
    },
    error: 'Invalid Ethereum address format',
  },
  {
    description:
      'should throw "ZERO_UNSTAKE_ERROR" if requested rewards is zero',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
    },
    mockRewards: {
      requested: '0',
      readyForClaim: '1',
    },
    error: 'No amount requested for unstake',
  },
  {
    description:
      'should throw "NOT_FILLED_UNSTAKE_MESSAGE" if readyForClaim is not equal to requested',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
    },
    mockRewards: {
      requested: '2',
      readyForClaim: '1',
    },
    error: 'Unstake request not filled yet',
  },
  {
    description:
      'should throw "CLAIM_WITHDRAW_REQUEST_ERROR" if an error occurs during the claimWithdrawRequest call',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
    },
    mockRewards: {
      requested: '1',
      readyForClaim: '1',
    },
    error:
      'An error occurred while claiming the withdraw request for an address',
  },
];

export const stakeSuccessFixture = [
  {
    description: 'should return a transaction object when stake is successful',
    args: {
      network: 'holesky',
      address: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
      amount: '0.1',
      source: '0',
    },
    result: {
      mockGasConsumption: 21000,
      expectedTx: {
        from: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
        to: '0xAFA848357154a6a624686b348303EF9a13F63264',
        value: 0.1,
        data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000000',
      },
    },
  },
];

export const stakeErrorFixture = [
  {
    description: 'should throw "WRONG_TYPE_MESSAGE" if amount is not a string',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 0.1,
      source: '0',
    },
    error: 'Wrong input type',
  },
  {
    description:
      'should throw "MIN_AMOUNT_ERROR" if amount is less than minAmount',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: '0.0001', // Less than minAmount
      source: '0',
    },
    error: 'Min Amount 100000000000000000 wei',
  },
];

export const unstakeSuccessFixture = [
  {
    description:
      'should return a transaction object when unstake is successful',
    args: {
      network: 'holesky',
      address: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
      amount: '0.0000001',
      allowedInterchangeNum: 0,
      source: '0',
    },
    mockedAutocompoundBalance: '3',
    result: {
      mockGasConsumption: 21000,
      expectedTx: {
        from: '0x057f0F0ba2e2f818c6fD4CA4A235F068495B6654',
        to: '0xAFA848357154a6a624686b348303EF9a13F63264',
        value: 0,
        data: '0x76ec871c000000000000000000000000000000000000000000000000000000174876e80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // replace with the encoded ABI of the unstake method
      },
    },
  },
];

export const unstakeErrorFixture = [
  {
    description: 'should throw "WRONG_TYPE_MESSAGE" if amount is not a string',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: 2,
      allowedInterchangeNum: 0,
      source: '0',
    },
    error: 'Wrong input type',
  },
  {
    description:
      'should throw "ADDRESS_FORMAT_ERROR" if address is not correct',
    args: {
      network: 'mainnet',
      address: 'invalid_address',
      amount: '1',
      allowedInterchangeNum: 0,
      source: '0',
    },
    error: 'Invalid Ethereum address format',
  },
  {
    description:
      'should throw "MAX_AMOUNT_FOR_UNSTAKE_ERROR" if amount is greater than balance',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: '3',
      allowedInterchangeNum: 0,
      source: '0',
    },
    mockedAutocompoundBalance: '1',
    error: 'Max Amount For Unstake 1',
  },
  {
    description:
      'should throw "UNSTAKE_ERROR" if something goes wrong during the unstake process',
    args: {
      network: 'mainnet',
      address: '0x69E0951Ae0efA1Cb4a8d6702bf064C98Fc8E9A6a',
      amount: '3',
      allowedInterchangeNum: 0,
      source: '0',
    },
    mockedAutocompoundBalance: undefined,
    error: 'An error occurred while unstaking funds from the pool',
  },
];
