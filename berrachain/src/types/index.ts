import type { Contract } from 'web3';
import { TESTNET_ABI } from '../bgt_testnet';
import { MAINNET_ABI } from '../bgt_mainnet';

export type Network = 'testnet' | 'mainnet';

export type BGTContract =
  | {
      network: 'testnet';
      contract: Contract<typeof TESTNET_ABI>;
    }
  | {
      network: 'mainnet';
      contract: Contract<typeof MAINNET_ABI>;
    };

export type Transaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};

export type BoostedQueue = {
  lastBlock: number;
  balance: string;
};
