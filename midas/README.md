# Everstake Wallet SDK - Midas Vaults

## Getting Started

### Step 1: Installing the library

To use this module via SDK you need to install SDK:

```sh
$ npm install @everstake/wallet-sdk-polygon
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-polygon
```

or you can use pnpm

```sh
$ pnpm add @everstake/wallet-sdk-polygon
```

## Step 2: Importing The library

After installing the package, you can import the Ethereum module and use the SDK:

#### Import ES6

```ts
// import module
import { Ethereum } from '@everstake/wallet-sdk-ethereum';
// or you can also use
import * as Ethereum from '@everstake/wallet-sdk-ethereum';
```

#### Import ES5

```ts
// import module
const { Ethereum } = require("@everstake/wallet-sdk-ethereum");
```

## Step 3: Using the library

Initialize Midas object this way:

```ts
const midas = new Midas();
await midas.init('eth_mainnet', 'mmev');
```

### 3.1 Depositing to Issuance Vault 

1. Increase allowance on supported token by calling `approveToIssuanceVault`
2. Deposit using `depositInstant`

### 3.2 Redeeming from Redemption Vault

1. Increase collateral token allowance to redemption vault by calling `approveToRedemptionVault`
2. Withdraw using `redeemInstant` or `redeemRequest`

Note: instant redeem upholds fee and is limited. To get fee percent call `getInstantRedeemFee`, and to get assets accessible for instant redeem use `getRedeemLiquidity` 