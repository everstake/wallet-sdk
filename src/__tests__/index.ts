/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  Blockchain,
  CheckToken,
  CreateToken,
  GetAssets,
  SetStats,
  WalletSDKError,
} from '../';

describe('@everstake/wallet-sdk (deprecated, API helpers only)', () => {
  it('still exports the shared, chain-agnostic API helpers', () => {
    expect(typeof Blockchain).toBe('function');
    expect(typeof WalletSDKError).toBe('function');
    expect(typeof CheckToken).toBe('function');
    expect(typeof SetStats).toBe('function');
    expect(typeof CreateToken).toBe('function');
    expect(typeof GetAssets).toBe('function');
  });
});
