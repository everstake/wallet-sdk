/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Instruction } from "@solana/kit";

export interface ApiResponse<T> {
  result: T;
}
export type TransactionResponse = {
  instructions: Instruction[];
  userAddress: string;
};