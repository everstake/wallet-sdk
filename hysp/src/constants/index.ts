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
    lpAddress: '0x0461bD693caE49bE9d030E5c212e080F9c78B846',
    usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tBillAddress: '0xDD629E5241CbC5919847783e6C96B2De4754e438',
    tBillDataFeed: '0xfCEE9754E8C375e145303b7cE7BEca3201734A2B',

    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
  base: {
    issuanceVaultAddress: '0x5f09Aff8B9b1f488B7d1bbaD4D89648579e55d61',
    redemptionVaultAddress: '0x9BF00b7CFC00D6A7a2e2C994DB8c8dCa467ee359',
    oracleAddress: '0x4Fe7f62B2F4eF077aEd8f458c8B4652f5dE8080f',
    tokenAddress: '0xccbad2823328BCcAEa6476Df3Aa529316aB7474A',
    lpAddress: '0x0461bD693caE49bE9d030E5c212e080F9c78B846',
    usdcAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    tBillAddress: '0x6B35F2E4C9D4c1da0eDaf7fd7Dc90D9bCa4b0873',
    tBillDataFeed: '0x544af5fd877974F99623cC56A8d98f983072a0E3',

    rpcUrl: 'https://go.getblock.io/b139646923054e4fa8b33933871ed308',
  },
};

export const ZeroReferrer =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const SECONDS_IN_DAY = 86400;
export const DAYS_IN_YEAR = 365;

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
