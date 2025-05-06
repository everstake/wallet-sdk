/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

export const CHAIN = 'aptos';

export const RPC_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';
export const VALIDATOR_ADDRESS =
  '0xdb5247f859ce63dbe8940cf8773be722a60dcc594a8be9aca4b76abceb251b8e';

// this variable is the key by which we can find out the balance by the address
export const APTOS_COIN_TYPE =
  '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';

export const DECIMAL = 8;
// 100000000 = 1 APT
export const BASE_NUM = 100000000;
// min amount for stake if user staking first once
export const MIN_AMOUNT = 11;
// min amount for stake if user staked >= 10 APT
export const LOWER_AMOUNT = 0.1;
