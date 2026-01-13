/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { address, Instruction } from '@solana/kit';
import { Decimal } from 'decimal.js';
import { HyspSolana } from '../hysp';

declare global {
  interface BigInt {
    toJSON(): number;
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const PLACEHOLDER_USER_ADDRESS = address(
  'Crc3qfV8QqdmGXNWSQnc8REsrDjViiSZMyjn6jsE51kj',
);
const PLACEHOLDER_TARGET_ADDRESS = address('11111111111111111111111111111113');
const PLACEHOLDER_SHARES_AMOUNT = new Decimal('0.1');

function createAdditionalInstruction(): Instruction {
  return {
    programAddress: address('11111111111111111111111111111112'),
    accounts: [
      { address: PLACEHOLDER_USER_ADDRESS, role: 0 },
      { address: PLACEHOLDER_TARGET_ADDRESS, role: 0 },
    ],
    data: new Uint8Array(
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 256)),
    ),
  } as unknown as Instruction;
}

describe('HyspSolana Transaction Size Tests', () => {
  let hyspSolana: HyspSolana;

  beforeAll(() => {
    hyspSolana = new HyspSolana('USDC');
  });

  describe('Transaction Size Limits', () => {
    it('should check balance and error if insufficient shares', async () => {
      const userShares = await hyspSolana.getUserShares(
        PLACEHOLDER_USER_ADDRESS,
      );

      console.log(`User shares: ${userShares.result.toString()}`);

      if (userShares.result.lt(PLACEHOLDER_SHARES_AMOUNT)) {
        console.warn('Insufficient shares for tests.');
        fail(
          'Insufficient shares for tests. Cannot proceed with transaction size tests.',
        );
      }
    }, 30000);

    it('should create a normal withdraw transaction within size limits', async () => {
      const result = await hyspSolana.withdraw(
        PLACEHOLDER_USER_ADDRESS,
        PLACEHOLDER_SHARES_AMOUNT,
      );

      expect(result.result).toBeDefined();
    }, 30000);

    it('should fail when transaction exceeds size limits with too many instructions', async () => {
      const additionalInstructions = [];

      for (let i = 0; i < 100; i++) {
        additionalInstructions.push(createAdditionalInstruction());
      }

      await expect(
        hyspSolana.withdraw(
          PLACEHOLDER_USER_ADDRESS,
          PLACEHOLDER_SHARES_AMOUNT,
          {
            afterInstructions: additionalInstructions,
          },
        ),
      ).rejects.toThrow(
        'Transaction exceeds the maximum size limit of 1232 bytes',
      );
    }, 30000);

    it('should handle edge case with some additional instructions', async () => {
      const moderateInstructions = [];

      for (let i = 0; i < 10; i++) {
        moderateInstructions.push(createAdditionalInstruction());
      }

      try {
        const result = await hyspSolana.withdraw(
          PLACEHOLDER_USER_ADDRESS,
          PLACEHOLDER_SHARES_AMOUNT,
          {
            afterInstructions: moderateInstructions,
          },
        );

        expect(result.result).toBeDefined();
      } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain(
          'Transaction exceeds the maximum size limit',
        );
      }
    }, 30000);
  });
});
