/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { ParseStakeAccountError, StakeAccount } from '../stakeAccount';
import { buildParsedStakeAccount } from './testData';

describe('StakeAccount', () => {
  it('parses a current Agave-style stake account where warmupCooldownRate is missing', () => {
    const raw = buildParsedStakeAccount({ includeWarmupCooldownRate: false });

    expect(() => new StakeAccount(raw)).not.toThrow();

    const parsed = new StakeAccount(raw);
    expect(
      parsed.account.data.info.stake?.delegation.warmupCooldownRate,
    ).toBeUndefined();
  });

  it('still parses a legacy stake account where warmupCooldownRate is present', () => {
    const raw = buildParsedStakeAccount({ includeWarmupCooldownRate: true });

    const parsed = new StakeAccount(raw);
    expect(parsed.account.data.info.stake?.delegation.warmupCooldownRate).toBe(
      0.25,
    );
  });

  it('throws ParseStakeAccountError when a genuinely required field (voter) is missing', () => {
    const raw = buildParsedStakeAccount({ includeVoter: false });

    expect(() => new StakeAccount(raw)).toThrow(ParseStakeAccountError);
  });

  it('computes identical stake state whether or not warmupCooldownRate is present', () => {
    const currentEpoch = 500;
    const withRate = new StakeAccount(
      buildParsedStakeAccount({ includeWarmupCooldownRate: true }),
    );
    const withoutRate = new StakeAccount(
      buildParsedStakeAccount({ includeWarmupCooldownRate: false }),
    );

    expect(withRate.stakeAccountState(currentEpoch)).toBe(
      withoutRate.stakeAccountState(currentEpoch),
    );
    expect(withRate.account.data.info.stake?.delegation.stake.toString()).toBe(
      withoutRate.account.data.info.stake?.delegation.stake.toString(),
    );
  });
});
