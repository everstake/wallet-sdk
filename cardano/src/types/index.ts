export type Network = 'mainnet' | 'preprod' | 'preview';

export type DelegationStatus = 'no-delegation' | 'pending' | 'active';

export type StakeActivation = {
  stakeAddress: string;
  delegatedPool: string;
  currentEpoch: number;
  activeEpoch: number;
  epochsUntilActive: number;
  hoursUntilActive: number;
  epochsUntilRewards: number;
  hoursUntilRewards: number;
  status: DelegationStatus;
};
