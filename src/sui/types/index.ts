/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export type SuiNetworkType = 'mainnet' | 'testnet';

export interface SuiNetworkAddresses {
  validatorAddress: string;
  rpcUrl: string;
}

export type SuiNetworkAddressesMap = {
  [K in SuiNetworkType]: SuiNetworkAddresses;
};
