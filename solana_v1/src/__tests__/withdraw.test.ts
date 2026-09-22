/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { StakeProgram } from '@solana/web3.js';
import { Solana } from '..';
import {
  baseConnectionMocks,
  mockConnection,
  SENDER,
  WITHDRAW_TARGET,
} from './testData';
import { compileExpected, expectTransactionsMatch, flatten } from './txHelpers';

describe('withdraw', () => {
  it('builds a single StakeProgram.withdraw instruction for the requested amount', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks());

    const { result } = await solana.withdraw(
      SENDER.publicKey.toBase58(),
      WITHDRAW_TARGET.publicKey,
      1_000_000_000,
    );

    const expected = StakeProgram.withdraw({
      stakePubkey: WITHDRAW_TARGET.publicKey,
      authorizedPubkey: SENDER.publicKey,
      toPubkey: SENDER.publicKey,
      lamports: 1_000_000_000,
    });
    expectTransactionsMatch(
      result,
      compileExpected(SENDER.publicKey, flatten(expected)),
    );
  });
});
