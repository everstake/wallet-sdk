export interface KoiosPoolInfo {
  pool_id_bech32: string;
  pool_id_hex: string;
  active_epoch_no: number | null;
  vrf_key_hash: string | null;
  margin: number | null;
  fixed_cost: string | null;
  pledge: string | null;
  deposit: string | null;
  reward_addr: string | null;
  reward_addr_delegated_drep: string | null;
  owners: string[] | null;
  meta_url: string | null;
  meta_hash: string | null;
  meta_json: MetaJSON;
  pool_status: string;
  retiring_epoch: string | null;
  op_cert: string | null;
  op_cert_counter: number | null;
  active_stake: string | null;
  sigma: number | null;
  block_count: number | null;
  live_pledge: string | null;
  live_stake: string | null;
  live_delegators: number | null;
  live_saturation: number | null;
  voting_power: string | null;
}

export interface MetaJSON {
  name: string;
  ticker: string;
  homepage: string;
  description: string;
}

export interface StakeAddressInfo {
  stake_address: string;
  status: string;
  delegated_pool: string | null;
  delegated_drep: string | null;
  total_balance: string;
  utxo: string;
  rewards: string;
  withdrawals: string;
  rewards_available: string;
  deposit: string;
  reserves: string;
  treasury: string;
  proposal_refund: string;
}

export interface EpochReward {
  stake_address: string;
  earned_epoch: number;
  spendable_epoch: number;
  amount: string;
  type: string;
  pool_id_bech32: string | null;
}

export interface StakeHistory {
  stake_address: string;
  pool_id_bech32: string;
  epoch_no: number;
  active_stake: number;
}

export interface AccountUpdates {
  stake_address: string;
  updates: AccountUpdate[];
}

export interface AccountUpdate {
  action_type: string;
  tx_hash: string;
  epoch_no: number;
  epoch_slot: number;
  absolute_slot: number;
  block_time: number;
}

export interface Tip {
  hash: string;
  epoch_no: number;
  abs_slot: number;
  epoch_slot: number;
  block_height: number;
  block_no: number;
  block_time: number;
}
