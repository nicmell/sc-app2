/**
 * Server-wide / argless commands plus a few multi-purpose messages
 * (sync, notify, dumpOSC, error, /cmd, /u_cmd).
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

// ── Argless ───────────────────────────────────────────────────────────

export const clearSched = (): OscMessage => message("/clearSched");
export const nrtEnd = (): OscMessage => message("/nrt_end");
export const quit = (): OscMessage => message("/quit");
export const rtMemoryStatus = (): OscMessage => message("/rt_memoryStatus");
export const status = (): OscMessage => message("/status");
export const version = (): OscMessage => message("/version");

// ── /sync ─────────────────────────────────────────────────────────────

/** `/sync id`. Prefer `WorkerClient.sendAndSync` which allocates the id
 *  for you — this helper is useful for embedding into `completionMsg`s. */
export const sync = (id: number): OscMessage => message("/sync", id);

// ── /notify ───────────────────────────────────────────────────────────

/** `/notify enable` (+ optional clientId for multi-client setups). */
export const notify = (enable: 0 | 1, clientId?: number): OscMessage =>
  clientId === undefined ? message("/notify", enable) : message("/notify", enable, clientId);

// ── /dumpOSC ──────────────────────────────────────────────────────────

/** Mode: 0=off, 1=parsed, 2=hex, 3=both. */
export const dumpOsc = (mode: 0 | 1 | 2 | 3): OscMessage => message("/dumpOSC", mode);

// ── /error ────────────────────────────────────────────────────────────

/** Server error-posting mode: 0=off, 1=on (default), 2=off-scope/on-bundle,
 *  -1/-2 = same for one command, then back. */
export const errorMode = (mode: number): OscMessage => message("/error", mode);

// ── /cmd and /u_cmd (plugin / UGen extension dispatch) ────────────────

export const cmd = (name: string, ...args: OscArg[]): OscMessage => message("/cmd", name, ...args);

export const uCmd = (
  nodeId: number,
  ugenIndex: number,
  commandName: string,
  ...args: OscArg[]
): OscMessage => message("/u_cmd", nodeId, ugenIndex, commandName, ...args);

// ── Raw escape hatch ─────────────────────────────────────────────────

/** Drop down to a raw address + positional args — for commands this
 *  package doesn't model specifically, or for experimenting. */
export const raw = (address: string, ...args: OscArg[]): OscMessage => message(address, ...args);
