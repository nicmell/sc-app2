/**
 * Clock-anchor protocol (see docs/clock.md) — the wall-time ping/pong.
 * Keep in sync with scripts/sc-classes/ScAppClock.sc (the sclang
 * responder; the pong's wire layout is pinned by codec.test.ts).
 *
 * Main ⇄ sclang (routed by the bridge's "clock" peer, no interception;
 * OPTIONAL — CLOCK_NTP_ENABLED gates the pings, nothing musical
 * consumes the estimate):
 *   `/clock/ntp/ping  clientId:i seq:i`
 *   `/clock/ntp/pong  clientId:i seq:i secs:i fracMs:f`
 *
 * scsynth → everyone (the __global_clock__ synth's SendReply, 20 Hz):
 *   `/clock/tick  nodeId:i replyId:i tick:f phase:f`
 * `tick` is the ABSOLUTE tick index (PulseCount — f32-exact to 2^24);
 * `phase` the Phasor's position in its 8192 ring, mirrored on bus 1000.
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

export const CLOCK_PING_ADDRESS = "/clock/ntp/ping";
export const CLOCK_PONG_ADDRESS = "/clock/ntp/pong";
export const CLOCK_TICK_ADDRESS = "/clock/tick";

export const clockPing = (clientId: number, seq: number): OscMessage =>
  message(CLOCK_PING_ADDRESS, clientId, seq);

/** SendReply layout: `[nodeId, replyId, ...values]` — values from index 2. */
export const ClockTick = {
  tick: (m: OscMessage): number => m.args[2] as number,
  phase: (m: OscMessage): number => m.args[3] as number,
};

export const ClockPong = {
  clientId: (m: OscMessage): number => m.args[0] as number,
  seq: (m: OscMessage): number => m.args[1] as number,
  /** Unix wall-clock ms, recombined from the split encoding. */
  serverTime: (m: OscMessage): number => (m.args[2] as number) * 1000 + (m.args[3] as number),
};
