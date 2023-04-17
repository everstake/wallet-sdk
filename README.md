# Everstake Wallet SDK

## Getting Started
You can use two different options to implement staking for Everstake validator.

## Option 1: REST API
You can use REST API to call methods which are described in [Swagger](https://wallet-sdk-api.everstake.one/swagger/) with detailed examples

```
https://wallet-sdk-api.everstake.one
```

## Option 2: JavaScript library
You can install and import Wallet SDK for Javascript.

### Step. 1: Installing the Library

Install the npm library by copying the code below.

```sh
$ npm install @everstake/wallet-sdk
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk
```

### Step. 2: Import Wallet SDK

After installing the app, you can import module of needed blockchain (Ethereum, Aptos, Solana, Cosmos, Polygon are available) and use the SDK:

#### Import ES6

```ts
// import module
import { Solana } from '@everstake/wallet-sdk';
// or you can also use
import * as Solana from '@everstake/wallet-sdk/chain/solana';
// import needed function
import { getDelegations } from '@everstake/wallet-sdk/chain/solana';
```

#### Import ES5

```ts
// import module
const { Solana } = require("@everstake/wallet-sdk");
// or you can also use
const { getDelegations } = require("@everstake/wallet-sdk/chain/solana");
```


## Questions and Feedback

If you have any questions, issues, or feedback, please file an issue
on [GitHub](https://github.com/everstake/wallet-sdk/issues).
