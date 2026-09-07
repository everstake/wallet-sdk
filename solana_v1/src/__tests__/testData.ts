/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  AccountInfo,
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
