# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run inside a specific chain package directory (e.g., `cd ethereum`):

```sh
pnpm test                  # run tests
pnpm test -- --testNamePattern="<test name>"  # run a single test
pnpm run lint              # ESLint
pnpm run type-check        # tsc
pnpm run prettier          # auto-format
pnpm run build             # type-check + lint + test, then tsup bundle
```

The root `package.json` is the legacy `@everstake/wallet-sdk` package; its source lives in `src/` and runs the same scripts.

## Architecture

This is a monorepo of independently published npm packages — one per blockchain. Each package shares no build-time dependency on another, but all import the shared `utils/` directory via relative path (`../../utils`).

**Published packages:**

| Directory     | Package name                              | Chain / product           |
|---------------|-------------------------------------------|---------------------------|
| `src/`        | `@everstake/wallet-sdk`                   | Legacy (Solana v1 only)   |
| `ethereum/`   | `@everstake/wallet-sdk-ethereum`          | ETH liquid staking pool   |
| `polygon/`    | `@everstake/wallet-sdk-polygon`           | Polygon                   |
| `berrachain/` | `@everstake/wallet-sdk-berrachain`        | Berachain                 |
| `solana_v1/`  | `@everstake/wallet-sdk-solana`            | Solana (legacy web3.js)   |
| `solana_v2/`  | `@everstake/wallet-sdk-solana-v2`         | Solana (`@solana/kit`)    |
| `cardano/`    | `@everstake/wallet-sdk-cardano`           | Cardano                   |
| `aptos/`      | `@everstake/wallet-sdk-aptos`             | Aptos                     |
| `sui/`        | `@everstake/wallet-sdk-sui`               | Sui                       |
| `hysp/`       | `@everstake/wallet-sdk-hysp`              | Hysp EVM vault (mToken)   |
| `hysp_solana/`| `@everstake/wallet-sdk-hysp-solana`       | Hysp Solana vault         |

**Shared utilities (`utils/`):**

- `utils/index.ts` — exports `Blockchain` abstract base class and `WalletSDKError`. Every chain class extends `Blockchain`.
- `utils/api.ts` — exports `CheckToken`, `SetStats`, `CreateToken`, `GetAssets` (REST calls to Everstake API).
- `utils/constants/` — shared API URLs.

**Internal structure (consistent across packages):**

```
<chain>/src/
  <chain>.ts          # Main class extending Blockchain
  index.ts            # Re-exports everything
  constants/
    index.ts          # Network addresses, program IDs, numeric constants
    errors.ts         # ERROR_MESSAGES and ORIGINAL_ERROR_MESSAGES maps
  types/
    index.ts          # Public types
  __tests__/          # Jest tests (fixture-driven)
  __fixtures__/       # Test fixtures: { description, args, result/error }
```

## Key patterns

**Error handling:** Two distinct methods on `Blockchain`:
- `this.throwError('CODE', ...values)` — for validation failures (pre-conditions). Throws immediately.
- `this.handleError('CODE', caughtError)` — called in `catch` blocks. Re-throws `WalletSDKError` as-is; wraps plain `Error` with message lookup from `ORIGINAL_ERROR_MESSAGES` (maps upstream contract error strings to user-facing messages).

**Transaction return convention:** Methods like `stake`, `unstake`, `depositInstant` return unsigned transaction objects (EVM: `EthTransaction`; Solana: a compiled `TransactionMessage`). Callers sign and broadcast.

**Amounts:** Human-readable units at the API boundary (ETH, not Wei; lamports passed as `bigint` for Solana). Conversion to/from wei happens inside the class.

**Hysp differs from other modules:**
- Constructor is synchronous; call `await hysp.init(network, url?)` before any other method.
- Uses `ethers` (not `web3`) and typechain-generated contract types from `src/typechain-types/`.
- Has `getRedeemRequests()` which uses Multicall3 for batched on-chain reads.

**Solana v2 vs v1:** `solana_v2` uses `@solana/kit` (the new web3.js v2 API) with `pipe`, `createTransactionMessage`, `appendTransactionMessageInstruction`, etc. `solana_v1` uses the legacy `@solana/web3.js` with `Transaction` and `sendTransaction`.

**Build:** Each package uses `tsup` to produce CJS (`dist/index.js`) + ESM (`dist/index.mjs`) + type declarations (`dist/index.d.ts`). `prebuild` runs type-check → lint → test before bundling.
