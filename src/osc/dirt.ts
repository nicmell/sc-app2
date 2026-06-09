// SuperDirt event helpers. The WebSocket and OSC decode now live in the worker
// (see src/osc/); here we only build the outbound `/dirt/play` packet — the
// WorkerClient encodes it to bytes.

import { OSC, atDate, type OscPacket } from "@sc-app/server-commands";

/** A SuperDirt event: a flat bag of params (`s`, `n`, `gain`, `note`, …). */
export type DirtEvent = Record<string, string | number>;

/** Build a `/dirt/play` bundle: flat `[key, value, …]` args, scheduled at
 *  `timetagMs` (a wall-clock ms timestamp — osc-js converts it to NTP). */
export function dirtPlayBundle(event: DirtEvent, timetagMs: number): OscPacket {
  const args: Array<string | number> = [];
  for (const [k, v] of Object.entries(event)) args.push(k, v);
  const message = new OSC.Message("/dirt/play", ...args);
  return new OSC.Bundle([message], atDate(timetagMs));
}
