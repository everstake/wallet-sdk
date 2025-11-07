/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { Blockhash } from "@solana/kit";

export interface ApiResponse<T> {
  result: T;
}

export type Params = {
  finalLatestBlockhash?: {
    /** a Hash as base-58 encoded string */
    blockhash: Blockhash;
    /** last block height at which the blockhash will be valid */
    lastValidBlockHeight: bigint;
  };
};