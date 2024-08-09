// ethereum.d.ts

declare module "@everstake/wallet-sdk/ethereum" {
  export const selectNetwork: (
    network: "mainnet" | "holesky",
    url?: string
  ) => {
    address_accounting: string;
    address_pool: string;
    contract_pool: any;
    contract_accounting: any;
    address_withdraw_treasury: string;
  };
}
