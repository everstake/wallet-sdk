/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { HyspSolana } from '..';
import { SupportedToken } from '../constants';

// Create a test class to access protected methods
class TestableHyspSolana extends HyspSolana {
  public testProcessMemo(memo?: string) {
    return this.processMemo(memo);
  }
}

describe('HyspSolana processMemo method', () => {
  const hyspSolana: TestableHyspSolana = new TestableHyspSolana(
    'USDC' as SupportedToken,
    'https://api.mainnet-beta.solana.com',
  );

  it('should return SDK when memo is empty', () => {
    const result = hyspSolana.testProcessMemo('');

    expect(new TextDecoder().decode(result.data)).toBe('SDK');
  });

  it('should prepend SDK: to memo without SDK prefix', () => {
    const result = hyspSolana.testProcessMemo('acme:pilotQ1:prod:v1');

    expect(new TextDecoder().decode(result.data)).toBe(
      'SDK:acme:pilotQ1:prod:v1',
    );
  });

  it('should keep memo unchanged when it has SDK prefix', () => {
    const result = hyspSolana.testProcessMemo('SDK:bankxyz::prod:v1');

    expect(new TextDecoder().decode(result.data)).toBe('SDK:bankxyz::prod:v1');
  });
});
