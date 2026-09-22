/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { PublicKey, StakeProgram } from '@solana/web3.js';
import { Solana } from '..';
import {
  baseConnectionMocks,
  mockConnection,
  SENDER,
  STAKE_ACCOUNT_ACTIVE,
} from './testData';
import { compileExpected, expectTransactionsMatch, flatten } from './txHelpers';

const MAINNET_VALIDATOR = new PublicKey(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);

describe('delegate', () => {
  it('builds a single StakeProgram.delegate instruction', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks());

    const { result } = await solana.delegate(
      SENDER.publicKey.toBase58(),
      3_000_000_000,
      STAKE_ACCOUNT_ACTIVE.publicKey.toBase58(),
    );

    const expected = StakeProgram.delegate({
      stakePubkey: STAKE_ACCOUNT_ACTIVE.publicKey,
      authorizedPubkey: SENDER.publicKey,
      votePubkey: MAINNET_VALIDATOR,
    });
    expectTransactionsMatch(
      result,
      compileExpected(SENDER.publicKey, flatten(expected)),
    );
    expect(result.signatures).toHaveLength(1); // payer only, unsigned
  });

  it('rejects amounts below the minimum stake threshold', async () => {
    const solana = new Solana();
    await expect(
      solana.delegate(
        SENDER.publicKey.toBase58(),
        1,
        STAKE_ACCOUNT_ACTIVE.publicKey.toBase58(),
      ),
    ).rejects.toThrow('Min Amount 1000000000');
  });
});
