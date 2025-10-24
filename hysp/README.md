# Everstake Wallet SDK - HYSP Vaults

## Getting Started

### Step 1: Installing the library

To use this module via SDK you need to install SDK:

```sh
$ npm install @everstake/wallet-sdk-hysp
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-hysp
```

or you can use pnpm

```sh
$ pnpm add @everstake/wallet-sdk-hysp
```

## Step 2: Importing The library

After installing the package, you can import the Hysp module and use the SDK:

#### Import ES6

```ts
// import module
import { Hysp } from '@everstake/wallet-sdk-hysp';
// or you can also use
import * as Hysp from '@everstake/wallet-sdk-hysp';
```

#### Import ES5

```ts
// import module
const { Hysp } = require("@everstake/wallet-sdk-hysp");
```

## Step 3: Using the library

Initialize Hysp object this way:

```ts
const hysp = new Hysp();
await hysp.init('eth_mainnet', 'mEVUSD');
```

### 3.1 Depositing to Issuance Vault 

1. Increase allowance on supported token by calling `approveToIssuanceVault`
2. Deposit using `depositInstant`

### 3.2 Redeeming from Redemption Vault

1. Increase collateral token allowance to redemption vault by calling `approveToRedemptionVault`
2. Withdraw using `redeemInstant` or `redeemRequest`

Note: instant redeem upholds fee and is limited. To get fee percent call `getInstantRedeemFee`, and to get assets accessible for instant redeem use `getRedeemLiquidity` 