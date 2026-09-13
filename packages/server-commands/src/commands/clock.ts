/**
 * Clock-anchor protocol (see docs/clock.md) — the wall-time ping/pong.
 * Keep in sync with scripts/sc-classes/ScAppClock.sc (the sclang
 * responder; the pong's wire layout is pinned by codec.test.ts).
 *
 * Main ⇄ sclang (routed by the bridge's "clock" peer, no interception):
 *   `/clock/ping  clientId:i seq:i`
 *   `/clock/pong  clientId:i seq:i secs:i fracMs:f`
 *
 * clientId/seq are echoed verbatim: peer replies ride the bridge's
 * broadcast fan-out to EVERY session, so the id is what lets a client
 * pick out its own pongs. The timestamp is split into integer Unix
 * seconds plus float32 fractional milliseconds — sclang's NetAddr
 * cannot emit an OSC double, and f64 Unix-ms squeezed into float32
 * would quantize to ~2 minutes (secs in int32 rolls over in 2038 —
 * accepted). The postMessage boundary carries NO clock vocabulary; the
 * metronome is the audio engine's /tr tick (AUDIO-CLOCK.md).
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const CLOCK_PING_ADDRESS = "/clock/ping";
export const CLOCK_PONG_ADDRESS = "/clock/pong";

export const clockPing = (clientId: number, seq: number): OscMessage =>
  message(CLOCK_PING_ADDRESS, clientId, seq);

export const ClockPong = {
  clientId: (m: OscMessage): number => m.args[0] as number,
  seq: (m: OscMessage): number => m.args[1] as number,
  /** Unix wall-clock ms, recombined from the split encoding. */
  serverTime: (m: OscMessage): number => (m.args[2] as number) * 1000 + (m.args[3] as number),
};
