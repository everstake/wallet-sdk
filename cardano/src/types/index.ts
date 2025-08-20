export type Network = 'mainnet' | 'preprod' | 'preview';

export interface DelegationEpoch {
  stakeAddress: string;
  delegatedPool?: string;
  currentEpoch: number;
  activeEpoch?: number;
  status: string;
  epochsUntilActive?: number;
  hoursUntilActive?: number;
  epochsUntilRewards?: number;
  hoursUntilRewards?: number;
}
