/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { Solana } from '..';
import { buildParsedStakeAccount, EPOCH_MAX } from './testData';

type MockedConnection = Pick<
  Connection,
  | 'getParsedProgramAccounts'
  | 'getEpochInfo'
  | 'getMinimumBalanceForRentExemption'
  | 'getLatestBlockhash'
>;

/** Injects a stubbed `Connection` into a `Solana` instance, bypassing the real RPC. */
function mockConnection(solana: Solana, overrides: Partial<MockedConnection>) {
  (solana as unknown as { connection: MockedConnection }).connection =
    overrides as MockedConnection;
}

const currentEpoch = 500;

function baseConnectionMocks(
  delegations: ReturnType<typeof buildParsedStakeAccount>[],
) {
  return {
    getParsedProgramAccounts: jest.fn().mockResolvedValue(
      delegations.map((account) => ({
        pubkey: Keypair.generate().publicKey,
        account,
      })),
    ),
    getEpochInfo: jest.fn().mockResolvedValue({
      epoch: currentEpoch,
      slotIndex: 0,
      slotsInEpoch: 1,
      absoluteSlot: 0,
    }),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(2282880),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 0,
    }),
  } as unknown as MockedConnection;
}

function instructionCount(tx: VersionedTransaction): number {
  return tx.message.compiledInstructions.length;
}

describe('unstake', () => {
  const sender = Keypair.generate().publicKey.toBase58();
  const stakeLamports = '2000000000'; // fully unstaked below -> no split needed

  it('succeeds when the delegation is missing warmupCooldownRate', async () => {
    const solana = new Solana();
    const delegation = buildParsedStakeAccount({
      stakeLamports,
      activationEpoch: '100',
      deactivationEpoch: EPOCH_MAX,
      includeWarmupCooldownRate: false,
    });
    mockConnection(solana, baseConnectionMocks([delegation]));

    const { result } = await solana.unstake(
      sender,
      Number(stakeLamports),
      sender,
    );

    expect(result).toBeInstanceOf(VersionedTransaction);
  });

  it('produces an equivalent transaction with and without warmupCooldownRate', async () => {
    const solanaWithout = new Solana();
    mockConnection(
      solanaWithout,
      baseConnectionMocks([
        buildParsedStakeAccount({
          stakeLamports,
          deactivationEpoch: EPOCH_MAX,
          includeWarmupCooldownRate: false,
        }),
      ]),
    );
    const solanaWith = new Solana();
    mockConnection(
      solanaWith,
      baseConnectionMocks([
        buildParsedStakeAccount({
          stakeLamports,
          deactivationEpoch: EPOCH_MAX,
          includeWarmupCooldownRate: true,
        }),
      ]),
    );

    const withoutRate = await solanaWithout.unstake(
      sender,
      Number(stakeLamports),
      sender,
    );
    const withRate = await solanaWith.unstake(
      sender,
      Number(stakeLamports),
      sender,
    );

    expect(instructionCount(withoutRate.result)).toBe(
      instructionCount(withRate.result),
    );
  });
});

describe('claim', () => {
  const sender = Keypair.generate().publicKey.toBase58();

  it('succeeds when the delegation is missing warmupCooldownRate', async () => {
    const solana = new Solana();
    const delegation = buildParsedStakeAccount({
      stakeLamports: '2000000000',
      activationEpoch: '100',
      deactivationEpoch: '200', // < currentEpoch -> deactivated, claimable
      includeWarmupCooldownRate: false,
    });
    mockConnection(solana, baseConnectionMocks([delegation]));

    const { result } = await solana.claim(sender);

    expect(result).toBeInstanceOf(VersionedTransaction);
    expect(instructionCount(result)).toBeGreaterThan(0);
  });

  it('produces an equivalent transaction with and without warmupCooldownRate', async () => {
    const solanaWithout = new Solana();
    mockConnection(
      solanaWithout,
      baseConnectionMocks([
        buildParsedStakeAccount({
          deactivationEpoch: '200',
          includeWarmupCooldownRate: false,
        }),
      ]),
    );
    const solanaWith = new Solana();
    mockConnection(
      solanaWith,
      baseConnectionMocks([
        buildParsedStakeAccount({
          deactivationEpoch: '200',
          includeWarmupCooldownRate: true,
        }),
      ]),
    );

    const withoutRate = await solanaWithout.claim(sender);
    const withRate = await solanaWith.claim(sender);

    expect(instructionCount(withoutRate.result)).toBe(
      instructionCount(withRate.result),
    );
  });
});
