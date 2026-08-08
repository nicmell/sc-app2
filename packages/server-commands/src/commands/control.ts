/**
 * Control-bus commands (/c_*). Control buses are the global scalar
 * namespace shared across synths — distinct from buffer memory.
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const cSet = (...pairs: ReadonlyArray<[number, number]>): OscMessage =>
  message("/c_set", ...pairs.flat());

/** `/c_setn startBus numValues v1 v2 …` — one contiguous run. */
export const cSetn = (startBus: number, values: readonly number[]): OscMessage =>
  message("/c_setn", startBus, values.length, ...values);

export const cFill = (...ranges: ReadonlyArray<[number, number, number]>): OscMessage =>
  message("/c_fill", ...ranges.flat());

export const cGet = (...busIndices: number[]): OscMessage => message("/c_get", ...busIndices);

/** `/c_getn startBus count` — single range. */
export const cGetn = (startBus: number, count: number): OscMessage =>
  message("/c_getn", startBus, count);
