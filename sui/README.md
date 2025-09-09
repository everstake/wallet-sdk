# Everstake Wallet SDK - Sui

## Getting Started

You can use two different options to implement Sui operations with the Everstake wallet SDK.

## Option 1: REST API

You can use REST API to call methods which are described in [Swagger](https://wallet-sdk-api.everstake.one/swagger/#/Sui) with detailed examples

```
https://wallet-sdk-api.everstake.one
```

## Option 2: TypeScript library

You can install and import Wallet SDK for Javascript/TypeScript.

### Step. 1: Installing the Library

Install the npm library by copying the code below.

```sh
$ npm install @everstake/wallet-sdk-sui
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-sui
```

### Step. 2: Import Wallet SDK

After installing the package, you can import the Sui module and use the SDK:

#### Import ES6

```ts
// import module
import { Sui } from '@everstake/wallet-sdk-sui';
// or you can also use
import * as Sui from '@everstake/wallet-sdk-sui';
```

#### Import ES5

```ts
// import module
const { Sui } = require('@everstake/wallet-sdk-sui');
```
