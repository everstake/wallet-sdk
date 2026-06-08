# CODEBASE.md

Ground truth for this repo. Covers conventions, architecture decisions, naming, forbidden patterns, tech stack. **Read this before reviewing.**

## Tech Stack

| Layer        | Tech                                      | Version  |
|--------------|-------------------------------------------|----------|
| Language     | TypeScript                                | ^5.5     |
| Runtime      | Node.js                                   | 18+      |
| Build        | tsup (CJS + ESM + `.d.ts`)                | ^8.x     |
| Tests        | Jest + ts-jest                            | ^29.x    |
| Linter       | ESLint + typescript-eslint + prettier     | ^9.x     |
| EVM (ETH/Polygon/Berachain) | web3 v4                    | 4.x      |
| EVM (Hysp)   | ethers v6                                 | ^6.x     |
| Solana v1    | @solana/web3.js                           | 1.98.x   |
| Solana v2 / Hysp Solana | @solana/kit                    | ^3.x     |

## Architecture

Monorepo of independently published npm packages — one per blockchain. Packages do **not** depend on each other at build time. All chain classes share a single internal base from `utils/` via relative import (`../../utils`).

### Package map

| Directory     | npm package                               | Chain / product         |
|---------------|-------------------------------------------|-------------------------|
| `src/`        | `@everstake/wallet-sdk`                   | Legacy (Solana v1 only) |
| `ethereum/`   | `@everstake/wallet-sdk-ethereum`          | ETH liquid staking pool |
| `polygon/`    | `@everstake/wallet-sdk-polygon`           | Polygon                 |
| `berrachain/` | `@everstake/wallet-sdk-berrachain`        | Berachain               |
| `solana_v1/`  | `@everstake/wallet-sdk-solana`            | Solana (legacy)         |
| `solana_v2/`  | `@everstake/wallet-sdk-solana-v2`         | Solana (@solana/kit)    |
| `cardano/`    | `@everstake/wallet-sdk-cardano`           | Cardano                 |
| `aptos/`      | `@everstake/wallet-sdk-aptos`             | Aptos                   |
| `sui/`        | `@everstake/wallet-sdk-sui`               | Sui                     |
| `hysp/`       | `@everstake/wallet-sdk-hysp`              | Hysp EVM vault (mToken) |
| `hysp_solana/`| `@everstake/wallet-sdk-hysp-solana`       | Hysp Solana vault       |

### Shared utilities (`utils/`)

Not published. Referenced by every chain package via relative path.

- `utils/index.ts` — `Blockchain` abstract base class + `WalletSDKError`.
- `utils/api.ts` — `CheckToken`, `SetStats`, `CreateToken`, `GetAssets` (REST calls to Everstake API).
- `utils/constants/` — shared API base URLs.

### Per-package structure (consistent across all packages)

```
<chain>/src/
  <chain>.ts          # Main exported class, extends Blockchain
  index.ts            # Re-exports everything public
  constants/
    index.ts          # Contract/program addresses, network configs, numeric limits
    errors.ts         # ERROR_MESSAGES and ORIGINAL_ERROR_MESSAGES maps
  types/
    index.ts          # All exported TypeScript types
  __tests__/          # Jest tests
  __fixtures__/       # Test data: { description, args, result } or { description, args, error }
```

## Naming Conventions

- Files: `camelCase.ts`, tests: `<subject>.test.ts` or `__tests__/index.ts`.
- Classes and types: `PascalCase`.
- Functions and variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Error code keys: `UPPER_SNAKE_CASE` strings (e.g. `'BALANCE_ERROR'`).
- Private class members: `private` keyword; use `_` prefix only when shadowing a public name.

## Code Patterns

### Class structure

Every chain module exports exactly one primary class that extends `Blockchain`:

```typescript
export class Ethereum extends Blockchain {
  protected ERROR_MESSAGES = ERROR_MESSAGES;          // required by Blockchain
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES; // required

  constructor(network: EthNetworkType = 'mainnet', url?: string) {
    super();
    this.initializeNetwork(network, url);
  }
}
```

`Hysp` differs: constructor is synchronous, async setup goes in `async init(network, url?)`.

### Error handling

Two distinct methods — use them correctly:

- `this.throwError('CODE', ...templateValues)` — validation failures, pre-conditions. Call directly (not inside try/catch). Throws `WalletSDKError` immediately.
- `this.handleError('CODE', caughtError)` — wrap `catch (error)` blocks. Re-throws `WalletSDKError` as-is; maps known upstream error strings via `ORIGINAL_ERROR_MESSAGES`; wraps unknown errors.

```typescript
// Correct pattern
public async stake(address: string, amount: string): Promise<EthTransaction> {
  if (!this.isAddress(address)) {
    this.throwError('ADDRESS_FORMAT_ERROR');       // validation, before try
  }
  try {
    const gas = await this.contract.methods.stake().estimateGas({ from: address });
    return { ... };
  } catch (error) {
    throw this.handleError('STAKE_ERROR', error);  // wraps RPC/contract errors
  }
}
```

Never swallow errors silently. Never `throw error` directly from a chain class method — always go through `handleError` or `throwError`.

### Transaction return convention

Methods that build on-chain actions return **unsigned** transaction objects. The caller signs and broadcasts.

- EVM chains return `EthTransaction`: `{ from, to, value, gasLimit, data }`.
- Solana returns a compiled `TransactionMessageWithBlockhashLifetime` (or wrapped in `ApiResponse<T>`).
- Gas/compute-unit estimation is done inside the SDK before returning.

### Amount conventions

- EVM amounts at the API boundary: human-readable ETH strings (`"0.1"`), not Wei. Conversion to Wei is done internally.
- Solana amounts: `bigint` lamports.
- `BigNumber` (bignumber.js) is used for all arithmetic to avoid floating-point issues.

### Hysp-specific

- Requires `await instance.init(network, url?)` before any other call. `init` fetches supported tokens and token metadata from contracts.
- Uses `ethers` v6 (not `web3`). Contract types are typechain-generated and live in `src/typechain-types/`.
- `getRedeemRequests()` uses Multicall3 for batched reads; `poolBalances()` / `userBalances()` in Ethereum use `ethereum-multicall`.

### Solana v2 vs v1

`solana_v2` uses `@solana/kit` (web3.js v2): `pipe`, `createTransactionMessage`, `appendTransactionMessageInstruction`, `createNoopSigner`, etc. Do not mix v1 (`@solana/web3.js`) and v2 APIs.

## Forbidden Patterns

- Hardcoded RPC URLs or contract addresses outside `constants/index.ts`.
- `any` without an `// eslint-disable` comment explaining why.
- Swallowing errors: `catch (e) {}` or `catch (e) { return null }`.
- `throw error` directly from a public method — must go through `handleError`.
- Mutating shared instance state per-request (contract instances and addresses are set at construction/init time only).
- Logging or exposing raw RPC response bodies, keys, or auth headers.
- Unbounded loops when fetching on-chain data.

## Acceptable Patterns

- `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment when casting ABI arrays (web3 contracts require `any[]`).
- `as unknown as T` when typechain types and web3 ABI types are structurally incompatible.
- Returning `0.0` or an empty array (not throwing) when on-chain data is unavailable but the absence is a valid state (e.g., `getAPY` when no historical rounds exist).
