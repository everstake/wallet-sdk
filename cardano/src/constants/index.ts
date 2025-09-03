export const POOLS_LIST_URL =
  'https://raw.githubusercontent.com/everstake/wallet-sdk/refs/heads/main/cardano/pools.json';

export const PREVIEW_DREP =
  'drep1yg524srxgfymg4d3atkvw22xyjfdcad62pjwzmn5azfwq8sxfxkxd';
export const PREPROD_DREP =
  'drep1ygneszm3h3qwvyzxjpm2fzp37ydjxfdxc0v07z9cudk4tkc2tp5pn';
export const MAINNET_DREP =
  'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3';

export const ERROR_MESSAGES = {
  NO_STAKING_ADDRESS: 'This account has not staking address',
  BLOCKFROST_API: 'An error occurred while fetching info from BLOCKFROST API',
  BLOCKFROST_STAKING_INFO: 'There is no staking info about current account',
  NO_BLOCKFROST_DELEGATION_FOUND:
    'There is no found any delegation using BLOCKFROST API',
  FETCH_POOL_LIST: 'An error occurred while fetching pool list',
  NO_REWARDS_YET: 'Account has no any rewards yet',
  INIT: 'To activate instance need to call init() method',
  ALREADY_STAKED: 'The Account has staked',
};
