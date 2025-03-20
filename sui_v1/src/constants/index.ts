/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';
import { SuiNetworkAddressesMap } from '../types';

export const SUI_NETWORK_ADDRESSES: SuiNetworkAddressesMap = {
  mainnet: {
    validatorAddress:
      '0xbba318294a51ddeafa50c335c8e77202170e1f272599a2edc40592100863f638',
    rpcUrl: 'https://sui-mainnet-endpoint.blockvision.org',
  },
  testnet: {
    validatorAddress:
      '0x155d5e5f1904db5f3a16924d0211b4c34cfcc947f345a1deff1452fc5373fed4',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
};

// 1 sui
export const SUI_BASE_NUM = new BigNumber(1000000000);

export const SUI_MIN_AMOUNT_FOR_STAKE = 1;
