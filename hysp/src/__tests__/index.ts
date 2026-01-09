/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Hysp } from '..';
import { EthTransaction, NetworkType } from '../types';
import { ethers } from 'ethers';

jest.mock('../hysp', () => {
  const actualHysp = jest.requireActual('../hysp');

  return {
    ...actualHysp,
    Hysp: class extends actualHysp.Hysp {
      private async calculateGasLimit(): Promise<number> {
        return 100000;
      }
    },
  };
});

describe('Hysp referrerId (memo) functionality', () => {
  let hysp: Hysp;
  const realSender = '0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341';
  const mockAmount = '100';
  const mockMinReceive = '95';
  let tokenIn: string;

  beforeAll(async () => {
    hysp = new Hysp();
    await hysp.init('eth_mainnet' as NetworkType);
    if (hysp.supportedIssuanceTokensAddresses.length === 0) {
      throw new Error('No supported issuance tokens found for the vault');
    }
    const firstToken = hysp.supportedIssuanceTokensAddresses[0];
    if (!firstToken) {
      throw new Error('First supported issuance token address is undefined');
    }
    tokenIn = firstToken;
  });

  it('should use user referrer id when provided', async () => {
    const userReferrerId = 'user123';

    const depositTx = await hysp.depositInstant(
      realSender,
      tokenIn,
      mockAmount,
      mockMinReceive,
      userReferrerId,
    );

    // Decode the transaction data to verify referrerId parameter
    const iface = new ethers.Interface([
      'function depositInstant(address tokenIn, uint256 amount, uint256 minReceiveAmount, bytes32 referrerId)',
    ]);

    const decoded = iface.parseTransaction({ data: depositTx.data });
    const actualReferrerIdBytes = decoded?.args[3];
    const actualReferrerId = ethers.decodeBytes32String(actualReferrerIdBytes);

    expect(actualReferrerId).toBe(`SDK:${userReferrerId}`);
  });

  it('should use SDK when referrer id is empty string', async () => {
    let depositTx: EthTransaction;
    try {
      console.log(tokenIn);
      depositTx = await hysp.depositInstant(
        realSender,
        tokenIn,
        mockAmount,
        mockMinReceive,
        '',
      );
    } catch (e) {
      console.error('Error during depositInstant:', e);
      throw e;
    }

    // Decode the transaction data to verify referrerId parameter
    const iface = new ethers.Interface([
      'function depositInstant(address tokenIn, uint256 amount, uint256 minReceiveAmount, bytes32 referrerId)',
    ]);

    const decoded = iface.parseTransaction({ data: depositTx.data });
    const actualReferrerIdBytes = decoded?.args[3];
    const actualReferrerId = ethers.decodeBytes32String(actualReferrerIdBytes);

    expect(actualReferrerId).toBe('SDK');
  });

  it('should throw error when memo exceeds 32 characters', async () => {
    const longMemo = 'this_is_a_very_long_memo_that_exceeds_32_characters';

    await expect(
      hysp.depositInstant(
        realSender,
        tokenIn,
        mockAmount,
        mockMinReceive,
        longMemo,
      ),
    ).rejects.toThrow(
      'Invalid memo: "SDK:this_is_a_very_long_memo_that_exceeds_32_characters". Must be max 32 characters',
    );
  });

  it('should throw error when memo contains invalid characters', async () => {
    const invalidMemo = 'user@123'; // @ is not allowed

    await expect(
      hysp.depositInstant(
        realSender,
        tokenIn,
        mockAmount,
        mockMinReceive,
        invalidMemo,
      ),
    ).rejects.toThrow(
      'Invalid memo: "SDK:user@123". Must contain only [A-Za-z0-9:_-] characters',
    );
  });
});
