// index.d.ts
import { Ethereum } from "./ethereum";

declare module "@everstake/wallet-sdk" {
  export const Polygon: any;
  export const Cosmos: any;
  export const Solana: any;
  export const Aptos: any;
  export const Sui: any;
  export const Ethereum: Ethereum;
  export const CreateToken: any;
  export const GetAssets: any;
}
