# Everstake Wallet SDK

## Getting Started

You can use two different options to implement staking for Everstake validator.

## Option 1: REST API

You can use REST API to call methods which are described in [Swagger](https://wallet-sdk-api.everstake.one/swagger/) with detailed examples

```
https://wallet-sdk-api.everstake.one
```

## Option 2: TypeScript library

Chain-specific functionality lives in dedicated, per-chain packages — install
the one(s) you need:

| Chain                        | Package                                |
| ---------------------------- | --------------------------------------- |
| Ethereum                     | `@everstake/wallet-sdk-ethereum`        |
| Polygon                      | `@everstake/wallet-sdk-polygon`         |
| Berachain                    | `@everstake/wallet-sdk-berrachain`      |
| Solana (`@solana/web3.js`)   | `@everstake/wallet-sdk-solana`          |
| Solana (`@solana/kit`)       | `@everstake/wallet-sdk-solana-v2`       |
| Cardano                      | `@everstake/wallet-sdk-cardano`         |
| Aptos                        | `@everstake/wallet-sdk-aptos`           |
| Sui                          | `@everstake/wallet-sdk-sui`             |
| Hysp (EVM vault)             | `@everstake/wallet-sdk-hysp`            |
| Hysp (Solana vault)          | `@everstake/wallet-sdk-hysp-solana`     |

> **`@everstake/wallet-sdk` (this package) is deprecated for chain-specific
> functionality.** It previously bundled a Solana implementation directly;
> that has been removed in favor of the actively maintained
> `@everstake/wallet-sdk-solana` package above. This package now only
> re-exports the shared, chain-agnostic API helpers below.

### Step. 1: Installing the Library

```sh
$ npm install @everstake/wallet-sdk
# or
$ yarn add @everstake/wallet-sdk
# or
$ pnpm add @everstake/wallet-sdk
```

### Step. 2: Import the shared API helpers

```ts
// ES6
import { CheckToken, SetStats, CreateToken, GetAssets } from '@everstake/wallet-sdk';

// ES5
const { CheckToken, SetStats, CreateToken, GetAssets } = require('@everstake/wallet-sdk');
```

## Questions and Feedback

If you have any questions, issues, or feedback, please file an issue
on [GitHub](https://github.com/everstake/wallet-sdk/issues).
