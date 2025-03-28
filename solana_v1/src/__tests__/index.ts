/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Solana } from '../';

describe('Solana', () => {
  it('should create a new Solana instance', () => {
    const solana = new Solana();
    expect(solana).toBeInstanceOf(Solana);
  });
});
