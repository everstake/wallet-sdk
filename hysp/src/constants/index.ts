/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { NetworksMap, HyspVaultsMap } from '../types';

export const HYSP_VAULTS_ADDRESSES: HyspVaultsMap = {
  mmev: {
    issuanceVaultAddress: '0xE092737D412E0B290380F9c8548cB5A58174704f',
    redemptionVaultAddress: '0xac14a14f578C143625Fc8F54218911e8F634184D',
    oracleAddress: '0x5f09Aff8B9b1f488B7d1bbaD4D89648579e55d61',
    tokenAddress: '0x030b69280892c888670EDCDCD8B69Fd8026A0BF3',

    Network: 'eth_mainnet',
  },
  mEVUSD: {
    issuanceVaultAddress: '0x5455222CCDd32F85C1998f57DC6CF613B4498C2a',
    redemptionVaultAddress: '0x9C3743582e8b2d7cCb5e08caF3c9C33780ac446f',
    oracleAddress: '0x6f51d8aF5bE2cF3517B8d6Cd07361bE382E83be6',
    tokenAddress: '0x548857309BEfb6Fb6F20a9C5A56c9023D892785B',

    Network: 'eth_mainnet',
  }
};

export const NETWORKS: NetworksMap = {
  eth_mainnet: {
    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
};

export const ZeroReferrer =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
