/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import type { VaultAddressesMap } from '../types';

export const NETWORK_ADDRESSES: VaultAddressesMap = {
  mainnet: {
    addressStrategy: '', // TODO:
    addressPool: '',
    addressLido: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    rpcUrl: 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1',
  },
  hoodi: {
    addressStrategy: '0x8dD8b3E523a7a762A13c8477af9C458148dacA09',
    addressPool: '',
    addressLido: '0x3508A952176b3c15387C97BE809eaffB1982176a',
    rpcUrl: 'https://ethereum-hoodi-rpc.publicnode.com',
  },
};
