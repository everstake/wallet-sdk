# Everstake Wallet SDK for Javascript

## Getting started

```
npm install everstake-wallet-sdk
```

After installing the app, you can then import and use the SDK:

```ts
import * as polygon from 'everstake-wallet-sdk';
```

## Everstake Wallet SDK Getting Info

The `get` namespace contains methods used for getting info. The unique methods to the `get` namespace are:

- `getReward(publicKey)`: Gets the user's reward balance in tokens.
- `getTotalDelegate(publicKey)`: Gets the user's delegate balance in tokens.
- `getUnbond(publicKey)`: Gets the user's unbond balance in tokens.

## Everstake Wallet SDK Delegate

The `delegate` namespace contains methods used for sending transactions on delegation. The unique methods to the `delegate` namespace are:

- `approve(publicKey, privateKey, amount)`: Approve of the amount for further debiting by a smart contract.
- `delegate(publicKey, privateKey, amount)`: Delegate user tokens.

## Everstake Wallet SDK Transaction

The `transaction` namespace contains methods used for sending transactions. The unique methods to the `transaction` namespace are:

- `unstake(publicKey, privateKey, amount)`: Unstake user tokens.
- `reward(publicKey, privateKey)`: Reward user tokens (Claim reward).
- `restake(publicKey, privateKey)`: Restake user tokens (Claim reward and auto delegate them).

## Everstake Wallet SDK Loading

The `loading` namespace contains methods used for getting info about loading transaction. The unique methods to the `loading` namespace are:

- `isTransactionLoading(hash)`: Waits for a transaction to be processed and returns the status of the transaction.

## Usage Examples

Below are examples of usage.

### Getting Info

```ts
import * as polygon from 'everstake-wallet-sdk';

// User wallet address.
const publicKey = '0x4D3F0BF20Dd5DA8C6800c5cA17d721131E366651';

// Gets the user's reward balance in tokens.
const getReward = await polygon.getReward(publicKey);
console.log(getRewaard); // 3.34036438662955358 (MATIC)

// Gets the user's delegate balance in tokens.
const getTotalDelegate = await polygon.getTotalDelegate(publicKey);
console.log(getTotalDelegate); // 20.5000000000000000 (MATIC)

// Gets the user's unbond balance in tokens.
const getUnbond = await polygon.getUnbond(publicKey);
console.log(getUnbond); // 2.2000000000000000 (MATIC)
```

### Delegate Polygon

```ts
import * as polygon from 'everstake-wallet-sdk';

// User wallet address.
const publicKey = '0x7CB380672D37E6Cc2e1dE28616076Cf3CCbdb82C';
// User private key.
const privateKey = '2f92e6761b7f055e39f73c995b097312f57886bb99999999999999999999999';
// The amount that the user delegates.
const amountDalegate = 10; // min value 1 (MATIC)

// Step 1 - Approve
const approve = await polygon.approve(publicKey, privateKey, amountDalegate);
console.log(approve); // if approve returns true or transaction hash.

// Step 2 - Delegate
const delegateHash = await polygon.delegate(publicKey, privateKey, amountDalegate);
console.log(delegateHash); // return transaction hash.

// Step 3 - Completed delegated
const loading = await polygon.isTransactionLoading(delegateHash);
console.log(loading); // returns true or false until the transaction status is either success or failed.
```

### Other Transaction

```ts
import * as polygon from 'everstake-wallet-sdk';

// User wallet address.
const publicKey = '0x7CB380672D37E6Cc2e1dE28616076Cf3CCbdb82C';
// User private key.
const privateKey = '2f92e6761b7f055e39f73c995b097312f57886bb99999999999999999999999';
// The amount that the user delegates.
const amountUnstake = 5;

// Unstake user tokens.
const unstake = await polygon.unstake(publicKey, privateKey, amountUnstake);
console.log(unstake); // return transaction hash.

// Reward user tokens (Claim reward).
const reward = await polygon.reward(publicKey, privateKey);
console.log(reward); // return transaction hash.

// Restake user tokens (Claim reward and auto delegate them).
const restake = await polygon.restake(publicKey, privateKey);
console.log(restake); // return transaction hash.
```

### Loading Transaction

```ts
import * as polygon from 'everstake-wallet-sdk';

// Hash transaction
const hash = '0x6a65103f50d40eb94b04fba1161e0dd44962f070bdcfc4c75b105ca37b2b08b2';

const loading = await polygon.isTransactionLoading(hash);
console.log(loading); // returns true or false until the transaction status is either success or failed
```

## Questions and Feedback

If you have any questions, issues, or feedback, please file an issue
on [GitHub](https://github.com/Mol0D337/test/issues).
