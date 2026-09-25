/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  AccountInfo,
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from '@solana/web3.js';

// u64::MAX — the deactivationEpoch value Agave reports for an active
// (never-deactivated) delegation.
export const EPOCH_MAX = '18446744073709551615';

const staker = Keypair.generate().publicKey.toBase58();
const withdrawer = Keypair.generate().publicKey.toBase58();
const custodian = Keypair.generate().publicKey.toBase58();
const voter = Keypair.generate().publicKey.toBase58();
const owner = Keypair.generate().publicKey;

export type BuildParsedStakeAccountOptions = {
  stakeLamports?: string;
  activationEpoch?: string;
  deactivationEpoch?: string;
  /** Toggles the field this fixture exists to cover — omitted by current Agave `jsonParsed` responses. */
  includeWarmupCooldownRate?: boolean;
  /** Toggles a genuinely required field, to prove real validation gaps still throw. */
  includeVoter?: boolean;
};

/**
 * Builds a raw `AccountInfo<ParsedAccountData>` shaped like the Solana
 * `jsonParsed` stake-account RPC response, so tests can toggle the presence
 * of `delegation.warmupCooldownRate` without duplicating the whole fixture
 * per case.
 */
export function buildParsedStakeAccount({
  stakeLamports = '1000000000',
  activationEpoch = '100',
  deactivationEpoch = EPOCH_MAX,
  includeWarmupCooldownRate = false,
  includeVoter = true,
}: BuildParsedStakeAccountOptions = {}): AccountInfo<
  Buffer | ParsedAccountData
> {
  const delegation: Record<string, unknown> = {
    stake: stakeLamports,
    activationEpoch,
    deactivationEpoch,
  };
  if (includeVoter) delegation.voter = voter;
  if (includeWarmupCooldownRate) delegation.warmupCooldownRate = 0.25;

  return {
    executable: false,
    owner,
    lamports: Number(stakeLamports) + 2282880,
    rentEpoch: 0,
    data: {
      program: 'stake',
      space: 200,
      parsed: {
        type: 'delegated',
        info: {
          meta: {
            rentExemptReserve: '2282880',
            authorized: { staker, withdrawer },
            lockup: { unixTimestamp: 0, epoch: 0, custodian },
          },
          stake: {
            delegation,
            creditsObserved: 123,
          },
        },
      },
    } as ParsedAccountData,
  };
}

export function randomPublicKey(): PublicKey {
  return Keypair.generate().publicKey;
}

// ---------------------------------------------------------------------------
// Deterministic fixtures — for tests that need byte-reproducible output
// (instruction/account/data-level assertions, serialized-transaction
// snapshots), as opposed to the random-per-run fixtures above, which are
// fine for structural-only assertions (instanceof, instruction counts).
// ---------------------------------------------------------------------------

/** A `Keypair` derived from a fixed 32-byte seed — same value on every run, unlike `Keypair.generate()`. */
export function fixedKeypair(fillByte: number): Keypair {
  return Keypair.fromSeed(Buffer.alloc(32, fillByte));
}

export const SENDER = fixedKeypair(1);
export const STAKE_ACCOUNT_ACTIVE = fixedKeypair(3);
export const STAKE_ACCOUNT_DEACTIVATED = fixedKeypair(4);
export const WITHDRAW_TARGET = fixedKeypair(7);
export const GENERATED_STAKE_ACCOUNT = fixedKeypair(9);

export const FIXED_BLOCKHASH = new PublicKey(new Uint8Array(32)).toBase58();
export const RENT_EXEMPT_LAMPORTS = 2282880;
export const CURRENT_EPOCH = 500;
export const FIXED_NOW_MS = 1700000000000; // 2023-11-14T22:13:20.000Z

export const ACTIVE_DELEGATION = {
  pubkey: STAKE_ACCOUNT_ACTIVE.publicKey,
  account: buildParsedStakeAccount({
    stakeLamports: '3000000000',
    activationEpoch: '100',
    deactivationEpoch: EPOCH_MAX,
  }),
};

export const DEACTIVATED_DELEGATION = {
  pubkey: STAKE_ACCOUNT_DEACTIVATED.publicKey,
  account: buildParsedStakeAccount({
    stakeLamports: '1000000000',
    activationEpoch: '100',
    deactivationEpoch: '450', // < CURRENT_EPOCH -> deactivated
  }),
};

/**
 * Freezes `Date`/`Date.now()` and `Keypair.generate()` so any code under
 * test that relies on either (e.g. `createAccountTx`'s `Keypair.generate()`,
 * or `formatSource`'s `new Date().getTime()`) produces reproducible output.
 * Call from `beforeAll`, and call the returned function from `afterAll` to
 * restore the originals — global state, so must not leak across files.
 */
export function installDeterministicEnv(
  generatedKeypair: Keypair = GENERATED_STAKE_ACCOUNT,
): () => void {
  const RealDate = Date;
  class FrozenDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(FIXED_NOW_MS);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        super(...(args as [any]));
      }
    }

    static now(): number {
      return FIXED_NOW_MS;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Date = FrozenDate;

  const realKeypairGenerate = Keypair.generate;
  Keypair.generate = () => generatedKeypair;

  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).Date = RealDate;
    Keypair.generate = realKeypairGenerate;
  };
}

// ---------------------------------------------------------------------------
// Connection mocking
// ---------------------------------------------------------------------------
export type MockedConnection = Pick<
  Connection,
  | 'getParsedProgramAccounts'
  | 'getEpochInfo'
  | 'getMinimumBalanceForRentExemption'
  | 'getLatestBlockhash'
>;

/**
 * Injects a stubbed `Connection` into a `Solana` instance, bypassing the real
 * RPC. Takes `unknown` (rather than importing `Solana` here, to keep this
 * file dependency-light) — callers pass a real `Solana` instance.
 */
export function mockConnection(
  solana: unknown,
  overrides: Partial<MockedConnection>,
): void {
  (solana as { connection: MockedConnection }).connection =
    overrides as MockedConnection;
}

/** Standard RPC mock set: fixed rent, blockhash, epoch, and delegation list. */
export function baseConnectionMocks(
  delegations: {
    pubkey: PublicKey;
    account: ReturnType<typeof buildParsedStakeAccount>;
  }[] = [],
): MockedConnection {
  return {
    getMinimumBalanceForRentExemption: jest
      .fn()
      .mockResolvedValue(RENT_EXEMPT_LAMPORTS),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: FIXED_BLOCKHASH,
      lastValidBlockHeight: 123456789,
    }),
    getParsedProgramAccounts: jest.fn().mockResolvedValue(delegations),
    getEpochInfo: jest.fn().mockResolvedValue({
      epoch: CURRENT_EPOCH,
      slotIndex: 100,
      slotsInEpoch: 432000,
      absoluteSlot: 216000100,
    }),
  } as unknown as MockedConnection;
}
