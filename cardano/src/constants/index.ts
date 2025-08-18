export const KOIOS_PREVIEW = 'https://preview.koios.rest/api/v1';
export const KOIOS_PREPROD = 'https://preprod.koios.rest/api/v1';
export const KOIOS_MAINNET = 'https://api.koios.rest/api/v1';

export const POOLS_LIST_URL =
  'https://raw.githubusercontent.com/everstake/wallet-sdk/refs/heads/main/cardano/pools.json';

export const ERROR_MESSAGES = {
  NO_STAKING_ADDRESS: 'This account has not staking address',
  TX_BUILD: 'An error occurred while building a tx',
  KOIOS_API: 'An error occurred while fetching info from KOIOS API',
  NO_KOIOS_STAKING_INFO: 'There is no staking info about current account',
  NO_KOIOS_DELEGATION_FOUND: 'There is no found any delegation using KOIOS API',
  KOIOS_EPOCH: 'There is no epoch info using KOIOS API',
  FETCH_POOL_LIST: 'An error occurred while fetching pool list',
};
