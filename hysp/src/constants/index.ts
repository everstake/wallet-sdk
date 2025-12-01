/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { NetworksMap } from '../types';

export const NETWORKS: NetworksMap = {
  eth_mainnet: {
    issuanceVaultAddress: '0x5455222CCDd32F85C1998f57DC6CF613B4498C2a',
    redemptionVaultAddress: '0x9C3743582e8b2d7cCb5e08caF3c9C33780ac446f',
    oracleAddress: '0x6f51d8aF5bE2cF3517B8d6Cd07361bE382E83be6',
    tokenAddress: '0x548857309BEfb6Fb6F20a9C5A56c9023D892785B',

    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
  base: {
    issuanceVaultAddress: '0x5f09Aff8B9b1f488B7d1bbaD4D89648579e55d61',
    redemptionVaultAddress: '0x9BF00b7CFC00D6A7a2e2C994DB8c8dCa467ee359',
    oracleAddress: '0x4Fe7f62B2F4eF077aEd8f458c8B4652f5dE8080f',
    tokenAddress: '0xccbad2823328BCcAEa6476Df3Aa529316aB7474A',

    rpcUrl: 'https://go.getblock.io/b139646923054e4fa8b33933871ed308',
  },
};

export const ZeroReferrer =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const APY_API_ENDPOINT = 'https://api-prod.midas.app/api/data/apys';
export const APY_VAULT_KEY = 'mevusd';
