/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { NetworksMap, HyspVaultsMap } from '../types';

export const HYSP_VAULTS_ADDRESSES: HyspVaultsMap = {
  mEVUSD: {
    issuanceVaultAddress: '0x5455222CCDd32F85C1998f57DC6CF613B4498C2a',
    redemptionVaultAddress: '0x9C3743582e8b2d7cCb5e08caF3c9C33780ac446f',
    oracleAddress: '0x6f51d8aF5bE2cF3517B8d6Cd07361bE382E83be6',
    tokenAddress: '0x548857309BEfb6Fb6F20a9C5A56c9023D892785B',

    Network: 'eth_mainnet',
  },
};

export const NETWORKS: NetworksMap = {
  eth_mainnet: {
    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
};

export const ZeroReferrer =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
