/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

/**
 * Shared instruction/transaction comparison utilities for the method
 * regression suites. Not a spec file itself — excluded from Jest's
 * `testMatch` via `jest.config.ts`, same as `testData.ts`.
 */

import {
  Keypair,
  MessageHeader,
  MessageV0,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { FIXED_BLOCKHASH } from './testData';

/** Indexed access that fails loudly instead of silently allowing `undefined` through (repo lint forbids `arr[i]!`). */
export function at<T>(arr: readonly T[], index: number): T {
  const value = arr[index];
  if (value === undefined) {
    throw new Error(`index ${index} out of bounds (length ${arr.length})`);
  }

  return value;
}

type DecompiledKey = {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
};
type DecompiledInstruction = {
  programId: PublicKey;
  keys: DecompiledKey[];
  data: Buffer;
};

function isSignerIndex(header: MessageHeader, index: number): boolean {
  return index < header.numRequiredSignatures;
}

function isWritableIndex(
  header: MessageHeader,
  totalKeys: number,
  index: number,
): boolean {
  if (index < header.numRequiredSignatures) {
    return (
      index < header.numRequiredSignatures - header.numReadonlySignedAccounts
    );
  }

  return index < totalKeys - header.numReadonlyUnsignedAccounts;
}

/** Decompiles a VersionedTransaction's (LUT-free) MessageV0 back into per-instruction detail. */
export function decompile(tx: VersionedTransaction): DecompiledInstruction[] {
  const msg = tx.message as MessageV0;
  expect(msg.addressTableLookups).toHaveLength(0);
  const keys = msg.staticAccountKeys;

  return msg.compiledInstructions.map((ix) => ({
    programId: at(keys, ix.programIdIndex),
    keys: ix.accountKeyIndexes.map((idx) => ({
      pubkey: at(keys, idx),
      isSigner: isSignerIndex(msg.header, idx),
      isWritable: isWritableIndex(msg.header, keys.length, idx),
    })),
    data: Buffer.from(ix.data),
  }));
}

/**
 * Builds an independent "expected" VersionedTransaction from raw instructions,
 * using the exact same `TransactionMessage(...).compileToV0Message()` +
 * `VersionedTransaction` pipeline the SDK's own `prepareTransaction` uses.
 * Compiling both sides identically is required: `compileToV0Message` legitimately
 * upgrades an account's signer/writable flags across the whole message (e.g. the
 * fee payer is always writable+signer even if a single instruction's own key
 * metadata says otherwise) — so comparing against a *raw*, uncompiled
 * `TransactionInstruction`'s per-key flags would produce false mismatches.
 */
export function compileExpected(
  payer: PublicKey,
  instructions: TransactionInstruction[],
  externalSigners: Keypair[] = [],
): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: FIXED_BLOCKHASH,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  if (externalSigners.length > 0) tx.sign(externalSigners);

  return tx;
}

/** Deep-compares two compiled transactions' instructions (order, program IDs, accounts + signer/writable flags, data), blockhash, and final serialized bytes. */
export function expectTransactionsMatch(
  actual: VersionedTransaction,
  expected: VersionedTransaction,
): void {
  expect(actual.message.recentBlockhash).toBe(expected.message.recentBlockhash);
  expect(actual.message.header).toEqual(expected.message.header);
  expect(actual.message.staticAccountKeys.map((k) => k.toBase58())).toEqual(
    expected.message.staticAccountKeys.map((k) => k.toBase58()),
  );

  const actualIx = decompile(actual);
  const expectedIx = decompile(expected);
  expect(actualIx).toHaveLength(expectedIx.length);
  actualIx.forEach((a, i) => {
    const e = at(expectedIx, i);
    expect(a.programId.equals(e.programId)).toBe(true);
    expect(a.keys).toHaveLength(e.keys.length);
    a.keys.forEach((k, j) => {
      const ek = at(e.keys, j);
      expect(k.pubkey.equals(ek.pubkey)).toBe(true);
      expect(k.isSigner).toBe(ek.isSigner);
      expect(k.isWritable).toBe(ek.isWritable);
    });
    expect(a.data.equals(e.data)).toBe(true);
  });

  expect(
    Buffer.from(actual.serialize()).equals(Buffer.from(expected.serialize())),
  ).toBe(true);
}

/** Flattens a mix of legacy `Transaction`s and bare `TransactionInstruction`s into an ordered instruction list. */
export function flatten(
  ...groups: (Transaction | TransactionInstruction)[]
): TransactionInstruction[] {
  return groups.flatMap((g) =>
    g instanceof Transaction ? g.instructions : [g],
  );
}
