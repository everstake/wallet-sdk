/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  ComputeBudgetProgram,
  StakeProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import { Solana } from '..';
import {
  ACTIVE_DELEGATION,
  baseConnectionMocks,
  buildParsedStakeAccount,
  DEACTIVATED_DELEGATION,
  EPOCH_MAX,
  mockConnection,
  randomPublicKey,
  SENDER,
  STAKE_ACCOUNT_ACTIVE,
  STAKE_ACCOUNT_DEACTIVATED,
} from './testData';
import { compileExpected, expectTransactionsMatch, flatten } from './txHelpers';

function instructionCount(tx: VersionedTransaction): number {
  return tx.message.compiledInstructions.length;
}

describe('unstake', () => {
  const sender = randomPublicKey().toBase58();
  const stakeLamports = '2000000000'; // fully unstaked below -> no split needed

  it('succeeds when the delegation is missing warmupCooldownRate', async () => {
    const solana = new Solana();
    const delegation = buildParsedStakeAccount({
      stakeLamports,
      activationEpoch: '100',
      deactivationEpoch: EPOCH_MAX,
      includeWarmupCooldownRate: false,
    });
    mockConnection(
      solana,
      baseConnectionMocks([{ pubkey: randomPublicKey(), account: delegation }]),
    );

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
        {
          pubkey: randomPublicKey(),
          account: buildParsedStakeAccount({
            stakeLamports,
            deactivationEpoch: EPOCH_MAX,
            includeWarmupCooldownRate: false,
          }),
        },
      ]),
    );
    const solanaWith = new Solana();
    mockConnection(
      solanaWith,
      baseConnectionMocks([
        {
          pubkey: randomPublicKey(),
          account: buildParsedStakeAccount({
            stakeLamports,
            deactivationEpoch: EPOCH_MAX,
            includeWarmupCooldownRate: true,
          }),
        },
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

  it('deactivates a fully-covered active delegation (no split) behind a compute-budget instruction', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks([ACTIVE_DELEGATION]));

    const { result } = await solana.unstake(
      SENDER.publicKey.toBase58(),
      3_000_000_000, // == full active stake -> deactivate, no split
      'unstake-source',
    );

    const expectedDeactivate = StakeProgram.deactivate({
      stakePubkey: STAKE_ACCOUNT_ACTIVE.publicKey,
      authorizedPubkey: SENDER.publicKey,
    });
    expectTransactionsMatch(
      result,
      compileExpected(SENDER.publicKey, [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
        ...flatten(expectedDeactivate),
      ]),
    );

    expect(
      Buffer.from(result.serialize()).toString('base64'),
    ).toMatchSnapshot();
  });

  it('throws when requested amount exceeds total active stake', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks([ACTIVE_DELEGATION]));

    await expect(
      solana.unstake(SENDER.publicKey.toBase58(), 999_000_000_000, 'src'),
    ).rejects.toThrow('Active stake less than requested');
  });
});

describe('claim', () => {
  const sender = randomPublicKey().toBase58();

  it('succeeds when the delegation is missing warmupCooldownRate', async () => {
    const solana = new Solana();
    const delegation = buildParsedStakeAccount({
      stakeLamports: '2000000000',
      activationEpoch: '100',
      deactivationEpoch: '200', // < currentEpoch -> deactivated, claimable
      includeWarmupCooldownRate: false,
    });
    mockConnection(
      solana,
      baseConnectionMocks([{ pubkey: randomPublicKey(), account: delegation }]),
    );

    const { result } = await solana.claim(sender);

    expect(result).toBeInstanceOf(VersionedTransaction);
    expect(instructionCount(result)).toBeGreaterThan(0);
  });

  it('produces an equivalent transaction with and without warmupCooldownRate', async () => {
    const solanaWithout = new Solana();
    mockConnection(
      solanaWithout,
      baseConnectionMocks([
        {
          pubkey: randomPublicKey(),
          account: buildParsedStakeAccount({
            deactivationEpoch: '200',
            includeWarmupCooldownRate: false,
          }),
        },
      ]),
    );
    const solanaWith = new Solana();
    mockConnection(
      solanaWith,
      baseConnectionMocks([
        {
          pubkey: randomPublicKey(),
          account: buildParsedStakeAccount({
            deactivationEpoch: '200',
            includeWarmupCooldownRate: true,
          }),
        },
      ]),
    );

    const withoutRate = await solanaWithout.claim(sender);
    const withRate = await solanaWith.claim(sender);

    expect(instructionCount(withoutRate.result)).toBe(
      instructionCount(withRate.result),
    );
  });

  it('withdraws every deactivated delegation for its full lamport balance', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks([DEACTIVATED_DELEGATION]));

    const { result } = await solana.claim(SENDER.publicKey.toBase58());

    const expectedWithdraw = StakeProgram.withdraw({
      stakePubkey: STAKE_ACCOUNT_DEACTIVATED.publicKey,
      authorizedPubkey: SENDER.publicKey,
      toPubkey: SENDER.publicKey,
      lamports: DEACTIVATED_DELEGATION.account.lamports,
    });
    expectTransactionsMatch(
      result,
      compileExpected(SENDER.publicKey, [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
        ...flatten(expectedWithdraw),
      ]),
    );
  });

  it('throws when there is nothing deactivated to claim', async () => {
    const solana = new Solana();
    mockConnection(solana, baseConnectionMocks([ACTIVE_DELEGATION]));

    await expect(solana.claim(SENDER.publicKey.toBase58())).rejects.toThrow(
      'Nothing to claim while claiming',
    );
  });
});
