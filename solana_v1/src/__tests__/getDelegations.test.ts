/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { StakeProgram } from '@solana/web3.js';
import { Solana } from '..';
import {
  ACTIVE_DELEGATION,
  baseConnectionMocks,
  DEACTIVATED_DELEGATION,
  mockConnection,
  SENDER,
} from './testData';

describe('getDelegations', () => {
  it('queries StakeProgram-owned parsed accounts filtered by size + authority memcmp offset', async () => {
    const solana = new Solana();
    const mocks = baseConnectionMocks([
      ACTIVE_DELEGATION,
      DEACTIVATED_DELEGATION,
    ]);
    mockConnection(solana, mocks);

    const { result } = await solana.getDelegations(SENDER.publicKey.toBase58());

    expect(result).toEqual([ACTIVE_DELEGATION, DEACTIVATED_DELEGATION]);
    expect(mocks.getParsedProgramAccounts).toHaveBeenCalledWith(
      StakeProgram.programId,
      {
        filters: [
          { dataSize: 200 },
          { memcmp: { offset: 44, bytes: SENDER.publicKey.toBase58() } },
        ],
      },
    );
  });
});
