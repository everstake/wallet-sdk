/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { VaultAddressesMap } from '../types';

// https://docs.lido.fi/deployed-contracts/
export const NETWORK_ADDRESSES: VaultAddressesMap = {
  mainnet: {
    // TODO:
    addressOracle: '',
    addressVault: '',
    addressPool: '',
    addressVaultHub: '',
    addressWrapper: '',
    addressLido: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
  hoodi: {
    addressOracle: '0xf41491C79C30e8f4862d3F4A5b790171adB8e04A',
    addressVault: '0x8dD8b3E523a7a762A13c8477af9C458148dacA09',
    addressPool: '0xAaAAb59c3AAA1e0EA2b414404D7D4EBF608031Cc',
    addressLido: '0x3508A952176b3c15387C97BE809eaffB1982176a',
    addressVaultHub: '0x4C9fFC325392090F789255b9948Ab1659b797964',
    addressWrapper: '0xaaaab59c3aaa1e0ea2b414404d7d4ebf608031cc',
    rpcUrl: 'https://ethereum-hoodi-rpc.publicnode.com',
  },
};
