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
  holesky: {
    addressContractAccounting: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
    addressContractPool: '0xAFA848357154a6a624686b348303EF9a13F63264',
    addressContractWithdrawTreasury:
      '0x66cb3AeD024740164EBcF04e292dB09b5B63A2e1',
    rpcUrl: 'https://ethereum-holesky.publicnode.com',
  },
};

export const ETH_GAS_RESERVE = new BigNumber(220000);

export const UINT16_MAX = 65535 | 0; // asm type annotation

export const ETH_MIN_AMOUNT = new BigNumber('100000000000000000');

export const MULTICALL_CONTRACT_ADDRESS =
  '0xca11bde05977b3631167028862be2a173976ca11';
