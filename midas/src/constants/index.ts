/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { NetworksMap, MidasVaultsMap } from '../types';

export const MIDAS_VAULTS_ADDRESSES: MidasVaultsMap = {
  mmev: {
    issuanceVaultAddress: '0xE092737D412E0B290380F9c8548cB5A58174704f',
    redemptionVaultAddress: '0xac14a14f578C143625Fc8F54218911e8F634184D',
    oracleAddress: '0x5f09Aff8B9b1f488B7d1bbaD4D89648579e55d61',
    tokenAddress: '0x030b69280892c888670EDCDCD8B69Fd8026A0BF3',

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
