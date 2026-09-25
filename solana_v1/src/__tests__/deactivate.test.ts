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
  STAKE_ACCOUNT_ACTIVE,
} from './testData';
import { compileExpected, expectTransactionsMatch, flatten } from './txHelpers';

describe('deactivate', () => {
  it('builds a single StakeProgram.deactivate instruction', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks());

    const { result } = await solana.deactivate(
      SENDER.publicKey.toBase58(),
      STAKE_ACCOUNT_ACTIVE.publicKey.toBase58(),
    );

    const expected = StakeProgram.deactivate({
      stakePubkey: STAKE_ACCOUNT_ACTIVE.publicKey,
      authorizedPubkey: SENDER.publicKey,
    });
    expectTransactionsMatch(
      result,
      compileExpected(SENDER.publicKey, flatten(expected)),
    );
  });
});
