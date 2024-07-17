// index.d.ts
declare module '@everstake/wallet-sdk' {
    export const Polygon: any;
    export const Cosmos: any;
    export const Solana: any;
    export const Aptos: any;
    export const Sui: any;
    export const Ethereum: {
        selectNetwork: (
            network: 'mainnet' | 'holesky',
            url?: string,
        ) => {
            address_accounting: string;
            address_pool: string;
            contract_pool: any;
            contract_accounting: any;
            address_withdraw_treasury: string;
        };
    };
    export const CreateToken: any;
    export const GetAssets: any;
}