# Everstake Wallet SDK - Kamino

## Getting Started

### Step 1: Installing the library

```sh
$ npm install @everstake/wallet-sdk-kamino
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-kamino
```

or you can use pnpm

```sh
$ pnpm add @everstake/wallet-sdk-kamino
```

## Step 2: Importing the library

After installing the package, you can import the Kamino module and use the SDK:

#### Import ES6

```ts
// import module
import { KaminoSDK } from '@everstake/wallet-sdk-kamino';
```

#### Import ES5

```ts
// import module
const { KaminoSDK } = require('@everstake/wallet-sdk-kamino');
```

## Step 3: Using the library

Initialize Kamino SDK:

```ts
const kamino = new KaminoSDK('USDC');
```

### 3.1 Depositing to Vault

Use `deposit` method to create deposit to vault transaction instructions.

### 3.2 Withdrawing from Vault

Use `withdraw` method to create withdraw from vault transaction instructions.

### 3.3 Checking Balance

Use `getUserShares` method to get user's vault shares balance.