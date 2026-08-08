/**
 * SynthDef commands. `/d_recv` is the one we lean on most — embed a
 * `/sync` packet in `completionMsg` to atomically correlate install
 * success.
 */

import type { OscArg, OscMessage, OscPacket } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

// ── /d_recv ───────────────────────────────────────────────────────────

/** Bytes of one or more compiled synthdefs. `completionMsg` is an
 *  plain OSC packet the worker codec packs as a blob. scsynth executes it
 *  *after* installation — a convenient place to embed `/sync`. */
export const dRecv = (bytes: Uint8Array, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined
    ? message("/d_recv", bytes)
    : message("/d_recv", bytes, completionMsg);

// ── /d_load, /d_loadDir ───────────────────────────────────────────────

export const dLoad = (path: string, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined ? message("/d_load", path) : message("/d_load", path, completionMsg);

export const dLoadDir = (path: string, completionMsg?: OscPacket): OscMessage =>
  completionMsg === undefined
    ? message("/d_loadDir", path)
    : message("/d_loadDir", path, completionMsg);

// ── /d_free ───────────────────────────────────────────────────────────

export const dFree = (...defNames: string[]): OscMessage => message("/d_free", ...defNames);
