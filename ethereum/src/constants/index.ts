/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { EthNetworkAddressesMap } from '../types';
import BigNumber from 'bignumber.js';

export const ETH_NETWORK_ADDRESSES: EthNetworkAddressesMap = {
  mainnet: {
    addressContractAccounting: '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e',
    addressContractPool: '0xD523794C879D9eC028960a231F866758e405bE34',
    addressContractWithdrawTreasury:
      '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
  hoodi: {
    addressContractAccounting: '0x6Cf2F03804b171ef9CAFC71e302CA0e08A3FDC28',
    addressContractPool: '0x7967AcFc9EB46cA2d20076B61B05e224F2d0B8b3',
    addressContractWithdrawTreasury:
      '0xCDd543223b6ef6CE26E7f80F7837c5C1A88aF683',
    rpcUrl: 'https://ethereum-hoodi-rpc.publicnode.com',
  },
};

export const ETH_GAS_RESERVE = new BigNumber(220000);

export const UINT16_MAX = 65535 | 0; // asm type annotation

export const ETH_MIN_AMOUNT = new BigNumber('100000000000000000');

export const MULTICALL_CONTRACT_ADDRESS =
  '0xca11bde05977b3631167028862be2a173976ca11';
