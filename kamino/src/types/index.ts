/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

// Note: Since Kamino SDK returns instructions rather than full transactions,
// we don't need the complex transaction message types for now
import { SupportedToken } from '../constants';

export interface ApiResponse<T> {
  result: T;
}
export type TransactionResponse = {
  instructions: any[];
  userAddress: string;
};