/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

export const ADDRESS_CONTRACT_APPROVE =
  '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
export const ADDRESS_CONTRACT_APPROVE_POL =
  '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6';

export const ADDRESS_CONTRACT_STAKING =
  '0x5e3Ef299fDDf15eAa0432E6e66473ace8c13D908';

export const ADDRESS_CONTRACT_BUY =
  '0xF30Cf4ed712D3734161fDAab5B1DBb49Fd2D0E5c';

export const MIN_AMOUNT = new BigNumber('1000000000000000000'); // 1 MATIC

export const DELEGATE_BASE_GAS = 220000n;
export const UNDELEGATE_BASE_GAS = 300000n;
export const CLAIM_UNDELEGATE_BASE_GAS = 200000n;
export const CLAIM_REWARDS_BASE_GAS = 180000n;
export const RESTAKE_BASE_GAS = 220000n;
export const WITHDRAW_EPOCH_DELAY = 80n;

export const CHAIN = 'polygon';

export const RPC_URL = 'https://ethereum-rpc.publicnode.com';
