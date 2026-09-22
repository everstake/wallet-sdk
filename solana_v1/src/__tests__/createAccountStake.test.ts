/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

/**
 * `createAccount` and `stake` are grouped here because `stake()` reuses the
 * same private `createAccountTx`/`createAccountWithSeedTx` helpers as
 * `createAccount()` (it's create-account + delegate + compute-budget in one
 * transaction) — the same "genuinely shared implementation" rationale behind
 * grouping `unstake`/`claim` in `unstakeClaim.test.ts`.
 */

import {
  ComputeBudgetProgram,
  Lockup,
  PublicKey,
  StakeProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import { Solana } from '..';
import {
  baseConnectionMocks,
  GENERATED_STAKE_ACCOUNT,
  installDeterministicEnv,
  mockConnection,
  RENT_EXEMPT_LAMPORTS,
  SENDER,
} from './testData';
import {
  at,
  compileExpected,
  expectTransactionsMatch,
  flatten,
} from './txHelpers';

// SOL_MAINNET_VALIDATOR_ADDRESS (src/constants/index.ts) — `delegate` doesn't
// expose the validator as a parameter, so `stake()`'s expected instruction
// must target the same constant.
const MAINNET_VALIDATOR = new PublicKey(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);

let restoreDeterministicEnv: () => void;

beforeAll(() => {
  restoreDeterministicEnv = installDeterministicEnv();
});

afterAll(() => {
  restoreDeterministicEnv();
});

describe('createAccount', () => {
  it('builds [SystemProgram.createAccount, StakeProgram.initialize] with the generated stake pubkey', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks());

    const { result } = await solana.createAccount(
      SENDER.publicKey,
      3_000_000_000,
      null,
      Lockup.default,
    );

    expect(result.stakeAccount.equals(GENERATED_STAKE_ACCOUNT.publicKey)).toBe(
      true,
    );
    expect(result.createStakeAccountVerTx).toBeInstanceOf(VersionedTransaction);

    const expectedTx = StakeProgram.createAccount({
      authorized: { staker: SENDER.publicKey, withdrawer: SENDER.publicKey },
      fromPubkey: SENDER.publicKey,
      lamports: 3_000_000_000 + RENT_EXEMPT_LAMPORTS,
      stakePubkey: GENERATED_STAKE_ACCOUNT.publicKey,
      lockup: Lockup.default,
    });
    expectTransactionsMatch(
      result.createStakeAccountVerTx,
      compileExpected(SENDER.publicKey, flatten(expectedTx), [
        GENERATED_STAKE_ACCOUNT,
      ]),
    );

    // payer + generated stake account are the two required signers, in that order
    const msg = result.createStakeAccountVerTx.message;
    expect(msg.header.numRequiredSignatures).toBe(2);
    expect(result.createStakeAccountVerTx.signatures).toHaveLength(2);
    // the SDK signs on behalf of the freshly generated stake account
    expect(
      at(result.createStakeAccountVerTx.signatures, 1).some((b) => b !== 0),
    ).toBe(true);
    // payer signature slot still empty — caller signs later
    expect(
      at(result.createStakeAccountVerTx.signatures, 0).every((b) => b === 0),
    ).toBe(true);

    expect(
      Buffer.from(result.createStakeAccountVerTx.serialize()).toString(
        'base64',
      ),
    ).toMatchSnapshot();
  });

  it('rejects amounts below the minimum stake threshold', async () => {
    const solana = new Solana();
    await expect(
      solana.createAccount(SENDER.publicKey, 1, null, Lockup.default),
    ).rejects.toThrow('Min Amount 1000000000');
  });
});

describe('stake', () => {
  it('builds [ComputeBudgetProgram.setComputeUnitPrice, SystemProgram.createAccount, StakeProgram.initialize, StakeProgram.delegate]', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks());

    const { result } = await solana.stake(
      SENDER.publicKey.toBase58(),
      2_000_000_000,
      null,
      Lockup.default,
    );

    const expectedCreate = StakeProgram.createAccount({
      authorized: { staker: SENDER.publicKey, withdrawer: SENDER.publicKey },
      fromPubkey: SENDER.publicKey,
      lamports: 2_000_000_000 + RENT_EXEMPT_LAMPORTS,
      stakePubkey: GENERATED_STAKE_ACCOUNT.publicKey,
      lockup: Lockup.default,
    });
    const expectedDelegate = StakeProgram.delegate({
      stakePubkey: GENERATED_STAKE_ACCOUNT.publicKey,
      authorizedPubkey: SENDER.publicKey,
      votePubkey: MAINNET_VALIDATOR,
    });

    expectTransactionsMatch(
      result,
      compileExpected(
        SENDER.publicKey,
        [
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
          ...flatten(expectedCreate),
          ...flatten(expectedDelegate),
        ],
        [GENERATED_STAKE_ACCOUNT],
      ),
    );

    expect(
      Buffer.from(result.serialize()).toString('base64'),
    ).toMatchSnapshot();
  });

  it('rejects amounts below the minimum stake threshold', async () => {
    const solana = new Solana();
    await expect(
      solana.stake(SENDER.publicKey.toBase58(), 1, null, Lockup.default),
    ).rejects.toThrow('Min Amount 1000000000');
  });
});
