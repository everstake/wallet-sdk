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
