import type {
  AbiInput,
  AbiOutput,
  StateMutabilityType,
  AbiType,
} from 'web3-utils';

export type NetworkType = 'mainnet' | 'holesky';

export interface NetworkAddresses {
  addressContractAccounting: string;
  addressContractPool: string;
  addressContractWithdrawTreasury: string;
  rpcUrl: string;
}

export type NetworkAddressesMap = {
  [K in NetworkType]: NetworkAddresses;
};

export type Transaction = {
  from: string;
  to: string;
  value: number;
  gasLimit: number;
  data: string;
};

export type ValidatorStatus = 'unknown' | 'pending' | 'deposited';

export interface ExtendedAbiItem {
  anonymous?: boolean;
  constant?: boolean;
  inputs?: AbiInput[];
  name?: string;
  outputs?: AbiOutput[];
  payable?: boolean;
  stateMutability?: StateMutabilityType;
  type: AbiType | 'error'; // added 'error' type to AbiType
  gas?: number;
}
