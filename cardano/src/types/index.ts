export * from './koios';

export type Network = 'mainnet' | 'preprod' | 'preview';

export interface DelegationEpoch {
  stakeAddress: string;
  currentEpoch: number;
  targetEpoch: number;
  epochsRemaining: number;
  hoursRemaining: number;
}
