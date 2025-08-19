export const POOLS_LIST_URL =
  'https://raw.githubusercontent.com/everstake/wallet-sdk/refs/heads/main/cardano/pools.json';

export const ERROR_MESSAGES = {
  NO_STAKING_ADDRESS: 'This account has not staking address',
  TX_BUILD: 'An error occurred while building a tx',
  BLOCKFROST_API: 'An error occurred while fetching info from BLOCKFROST API',
  BLOCKFROST_STAKING_INFO: 'There is no staking info about current account',
  NO_BLOCKFROST_DELEGATION_FOUND:
    'There is no found any delegation using BLOCKFROST API',
  BLOCKFROST_EPOCH: 'There is no epoch info using BLOCKFROST API',
  FETCH_POOL_LIST: 'An error occurred while fetching pool list',
};
