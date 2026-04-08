/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { HyspSolana } from '..';
import { SupportedToken } from '../constants';
import { WalletSDKError } from '../../../utils';

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

  describe('Error cases', () => {
    it('should throw MEMO_REQUIRED_ERROR when memo is undefined', () => {
      expect(() => hyspSolana.testProcessMemo(undefined)).toThrow(
        WalletSDKError,
      );
      expect(() => hyspSolana.testProcessMemo(undefined)).toThrow(
        'Memo is required. Please contact us to get your referrer ID.',
      );
    });

    it('should throw MEMO_REQUIRED_ERROR when memo is empty string', () => {
      expect(() => hyspSolana.testProcessMemo('')).toThrow(WalletSDKError);
      expect(() => hyspSolana.testProcessMemo('')).toThrow(
        'Memo is required. Please contact us to get your referrer ID.',
      );
    });

    it('should throw MEMO_REQUIRED_ERROR when memo is only whitespace', () => {
      expect(() => hyspSolana.testProcessMemo('   ')).toThrow(WalletSDKError);
      expect(() => hyspSolana.testProcessMemo('   ')).toThrow(
        'Memo is required. Please contact us to get your referrer ID.',
      );
    });

    it('should throw MEMO_TOO_LONG_ERROR when processed memo exceeds 64 characters', () => {
      const longMemo = 'a'.repeat(70);
      expect(() => hyspSolana.testProcessMemo(longMemo)).toThrow(
        WalletSDKError,
      );
      expect(() => hyspSolana.testProcessMemo(longMemo)).toThrow(
        'Must be max 64 characters',
      );
    });

    it('should throw MEMO_INVALID_CHARACTERS_ERROR when memo contains invalid characters', () => {
      expect(() => hyspSolana.testProcessMemo('test@domain')).toThrow(
        WalletSDKError,
      );
      expect(() => hyspSolana.testProcessMemo('test@domain')).toThrow(
        'Must contain only [A-Za-z0-9:_-] characters',
      );
    });

    it('should throw MEMO_INVALID_CHARACTERS_ERROR when memo contains spaces', () => {
      expect(() => hyspSolana.testProcessMemo('test memo')).toThrow(
        WalletSDKError,
      );
      expect(() => hyspSolana.testProcessMemo('test memo')).toThrow(
        'Must contain only [A-Za-z0-9:_-] characters',
      );
    });

    it('should throw MEMO_INVALID_CHARACTERS_ERROR when memo contains special characters', () => {
      expect(() => hyspSolana.testProcessMemo('test!memo#')).toThrow(
        WalletSDKError,
      );
      expect(() => hyspSolana.testProcessMemo('test!memo#')).toThrow(
        'Must contain only [A-Za-z0-9:_-] characters',
      );
    });
  });

  describe('Success cases', () => {
    it('should prepend SDK: to memo without SDK prefix', () => {
      const result = hyspSolana.testProcessMemo('acme:pilotQ1:prod:v1');

      expect(new TextDecoder().decode(result.data)).toBe(
        'SDK:acme:pilotQ1:prod:v1',
      );
    });

    it('should keep memo unchanged when it starts with SDK (but not SDK:)', () => {
      const result = hyspSolana.testProcessMemo('SDKtest');

      expect(new TextDecoder().decode(result.data)).toBe('SDKtest');
    });

    it('should keep memo unchanged when it starts with SDK:', () => {
      const result = hyspSolana.testProcessMemo('SDK:bankxyz::prod:v1');

      expect(new TextDecoder().decode(result.data)).toBe(
        'SDK:bankxyz::prod:v1',
      );
    });

    it('should handle simple referrer ID', () => {
      const result = hyspSolana.testProcessMemo('referrer123');

      expect(new TextDecoder().decode(result.data)).toBe('SDK:referrer123');
    });

    it('should handle referrer ID with underscores and hyphens', () => {
      const result = hyspSolana.testProcessMemo('test_ref-id_123');

      expect(new TextDecoder().decode(result.data)).toBe('SDK:test_ref-id_123');
    });

    it('should handle referrer ID with colons', () => {
      const result = hyspSolana.testProcessMemo('org:team:user');

      expect(new TextDecoder().decode(result.data)).toBe('SDK:org:team:user');
    });

    it('should handle maximum allowed length without SDK prefix', () => {
      const maxMemo = 'a'.repeat(59); // 59 + 'SDK:' = 63 chars (under limit)
      const result = hyspSolana.testProcessMemo(maxMemo);

      expect(new TextDecoder().decode(result.data)).toBe(`SDK:${maxMemo}`);
    });

    it('should handle maximum allowed length with SDK prefix', () => {
      const maxMemo = 'SDK:' + 'a'.repeat(60); // exactly 64 chars
      const result = hyspSolana.testProcessMemo(maxMemo);

      expect(new TextDecoder().decode(result.data)).toBe(maxMemo);
    });

    it('should trim whitespace from memo', () => {
      const result = hyspSolana.testProcessMemo('  referrer123  ');

      expect(new TextDecoder().decode(result.data)).toBe('SDK:referrer123');
    });
  });
});
