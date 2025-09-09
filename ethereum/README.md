# Everstake Wallet SDK - Ethereum

## Getting Started

You can use two different options to implement Ethereum operations with the Everstake wallet SDK.

## Option 1: REST API

You can use REST API to call methods which are described in [Swagger](https://wallet-sdk-api.everstake.one/swagger/#/Ethereum) with detailed examples

```
https://wallet-sdk-api.everstake.one
```

## Option 2: TypeScript library

You can install and import Wallet SDK for Javascript/TypeScript.

### Step. 1: Installing the Library

Install the npm library by copying the code below.

```sh
$ npm install @everstake/wallet-sdk-ethereum
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-ethereum
```

### Step. 2: Import Wallet SDK

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
const { Ethereum } = require('@everstake/wallet-sdk-ethereum');
```
