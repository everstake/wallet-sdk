# Wallet SDK Polygon for Javascript

## Getting started

```
npm install @everstake/wallet-sdk-polygon
```

### Setup Wallet SDK Polygon

After installing the app, you can then import and use the SDK:

```ts
import * as polygon from 'everstake-wallet-sdk';
```

## Wallet SDK Polygon Setup

The `setup` namespace contains methods used for setup SDK. The unique methods to the `setup` namespace are:

- `setup(apiUrl)`: This function setup your eth-mainnet api url.

## You Can Take ETH Mainnet Api

- [Infura](https://infura.io/)
- [Alchemy](https://www.alchemy.com/)
- [Zmok](https://zmok.io/)
- [Rivet Cloud](https://rivet.cloud/)
- [ChainStack](https://chainstack.com/)
- or any other option

## Wallet SDK Polygon Getting Info

The `get` namespace contains methods used for getting info. The unique methods to the `get` namespace are:

- `getReward(publicKey)`: Gets the user's reward balance in tokens.
- `getTotalDelegate(publicKey)`: Gets the user's delegate balance in tokens.
- `getUnbond(publicKey)`: Gets the user's unbond balance in tokens.

## Wallet SDK Polygon Delegate

The `delegate` namespace contains methods used for sending transactions on delegation. The unique methods to the `delegate` namespace are:

- `approve(publicKey, privateKey, amount)`: Approve of the amount for further debiting by a smart contract.
- `delegate(publicKey, privateKey, amount)`: Delegate user tokens.

## Wallet SDK Polygon Transaction

The `transaction` namespace contains methods used for sending transactions. The unique methods to the `transaction` namespace are:

- `unstake(publicKey, privateKey, amount)`: Unstake user tokens.
- `reward(publicKey, privateKey)`: Reward user tokens (Claim reward).
- `restake(publicKey, privateKey)`: Restake user tokens (Claim reward and auto delegate them).

## Wallet SDK Polygon Loading

The `loading` namespace contains methods used for getting info about loading transaction. The unique methods to the `loading` namespace are:

- `isTransactionLoading(hash)`: Waits for a transaction to be processed and returns the status of the transaction.

## Usage Examples

Below are examples of usage.

### Setup Function

```ts
// Import SDK
import * as polygon from '@everstake/wallet-sdk-polygon';
// https url api ethereum mainnet.
const apiUrl = process.env.API_URL_ETH_MAINNET; // https://eth-mainnet/CD4GB...mrMj5
// Setup SDK
await polygon.setup(apiUrl);
```

### Getting Info

```ts
// Import SDK
import * as polygon from '@everstake/wallet-sdk-polygon';
// https url api ethereum mainnet.
const apiUrl = process.env.API_URL_ETH_MAINNET; // https://eth-mainnet/CD4GB...mrMj5
// Setup SDK
await polygon.setup(apiUrl);

// User wallet address.
const publicKey = '0x4D3F0BF20Dd5DA8C6800c5cA17d721131E366651';

// Gets the user's reward balance in tokens.
const getReward = await polygon.getReward(publicKey);
console.log(getReward); // 3.34036438662955358 (MATIC)

// Gets the user's delegate balance in tokens.
const getTotalDelegate = await polygon.getTotalDelegate(publicKey);
console.log(getTotalDelegate); // 20.5000000000000000 (MATIC)

// Gets the user's unbond balance in tokens.
const getUnbond = await polygon.getUnbond(publicKey);
console.log(getUnbond); // 2.2000000000000000 (MATIC)
```

### Delegate Polygon

```ts
// Import SDK
import * as polygon from '@everstake/wallet-sdk-polygon';
// https url api ethereum mainnet.
const apiUrl = process.env.API_URL_ETH_MAINNET; // https://eth-mainnet/CD4GB...mrMj5
// Setup SDK
await polygon.setup(apiUrl);

// User wallet address.
const publicKey = '0x7CB380672D37E6Cc2e1dE28616076Cf3CCbdb82C';
// User private key.
const privateKey = process.env.PRIVATE_KEY; // 2f92e...6761b
// The amount that the user delegates.
const amountDalegate = 10; // min value 1 (MATIC)

// Step 1 - Approve
const approve = await polygon.approve(publicKey, privateKey, amountDalegate);
console.log(approve); // if approve returns true or transaction info.

// Step 2 - Delegate
const delegateHash = await polygon.delegate(publicKey, privateKey, amountDalegate);
console.log(delegateHash); // return transaction info.

// Step 3 - Completed delegated
const loading = await polygon.isTransactionLoading(delegateHash);
console.log(loading); // returns true or false until the transaction status is either success or failed.
```

### Other Transaction

```ts
// Import SDK
import * as polygon from '@everstake/wallet-sdk-polygon';
// https url api ethereum mainnet.
const apiUrl = process.env.API_URL_ETH_MAINNET; // https://eth-mainnet/CD4GB...mrMj5
// Setup SDK
await polygon.setup(apiUrl);

// User wallet address.
const publicKey = '0x7CB380672D37E6Cc2e1dE28616076Cf3CCbdb82C';
// User private key.
const privateKey = process.env.PRIVATE_KEY; // 2f92e...6761b
// The amount that the user delegates.
const amountUnstake = 5;

// Unstake user tokens.
const unstake = await polygon.unstake(publicKey, privateKey, amountUnstake);
console.log(unstake); // return transaction info.

// Reward user tokens (Claim reward).
const reward = await polygon.reward(publicKey, privateKey);
console.log(reward); // return transaction info.

// Restake user tokens (Claim reward and auto delegate them).
const restake = await polygon.restake(publicKey, privateKey);
console.log(restake); // return transaction info.
```

### Loading Transaction

```ts
// Import SDK
import * as polygon from '@everstake/wallet-sdk-polygon';
// https url api ethereum mainnet.
const apiUrl = process.env.API_URL_ETH_MAINNET; // https://eth-mainnet/CD4GB...mrMj5
// Setup SDK
await polygon.setup(apiUrl);

// Hash transaction
const hash = '0x6a65103f50d40eb94b04fba1161e0dd44962f070bdcfc4c75b105ca37b2b08b2';

const loading = await polygon.isTransactionLoading(hash);
console.log(loading); // returns true or false until the transaction status is either success or failed
```

### Transaction Info Example

```ts
transactionInfoExample = {
  blockHash: '0x1d1d618c773ec3ea66840bce04c3806262ba4a7da01ad781d1369460e9b1496b',
  blockNumber: 16127029,
  contractAddress: null,
  cumulativeGasUsed: 15758091,
  effectiveGasPrice: 15745277243,
  from: '0x7cb380672d37e6cc2e1de28616076cf3ccbdb82c',
  gasUsed: 28552,
  logs: [
    {
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      topics: [Array],
      data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      blockNumber: 16127029,
      transactionHash: '0x9c4928cbe37dbe6e3b86c017be7d33cccb6e7acad428b4cdbd323d04b8252bcd',
      transactionIndex: 191,
      blockHash: '0x1d1d618c773ec3ea66840bce04c3806262ba4a7da01ad781d1369460e9b1496b',
      logIndex: 297,
      removed: false,
      id: 'log_1ffd0665'
    }
  ],
  logsBloom: '0x00000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000004200000000200000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000002000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000',
  status: true,
  to: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
  transactionHash: '0x9c4928cbe37dbe6e3b86c017be7d33cccb6e7acad428b4cdbd323d04b8252bcd',
  transactionIndex: 191,
  type: '0x0'
}
```

## Questions and Feedback

If you have any questions, issues, or feedback, please file an issue
on [GitHub](https://github.com/everstake/wallet-sdk-polygon/issues).
