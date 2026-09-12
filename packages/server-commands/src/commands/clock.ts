/**
 * Bridge clock protocol (see docs/clock.md) — three messages. Keep in sync
 * with src-tauri/src/core/clock.rs — the bridge answers pings; the sample
 * stays inside the frontend (worker → webview, never on the wire).
 *
 * Worker ⇄ bridge (fast cadence while the socket is open):
 *   `/clock/ping  seq:i`        — seq echoes back; send time kept worker-side
 *   `/clock/pong  seq:i srv:d`  — srv = bridge Unix wall-clock ms
 * Worker → webview:
 *   `/clock/sample  offset:d rtt:d` — ONE raw sample per pong. It is BOTH the
 *                                     measurement (the main-thread ClockSync
 *                                     applies the min-RTT filter) and the
 *                                     main thread's metronome (sample-driven
 *                                     clock callbacks).
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const CLOCK_PING_ADDRESS = "/clock/ping";
export const CLOCK_PONG_ADDRESS = "/clock/pong";
export const CLOCK_SAMPLE_ADDRESS = "/clock/sample";

export const clockPing = (seq: number): OscMessage => message(CLOCK_PING_ADDRESS, seq);
export const clockSample = (offset: number, rtt: number): OscMessage =>
  message(CLOCK_SAMPLE_ADDRESS, offset, rtt);

export const ClockPong = {
  seq: (m: OscMessage): number => m.args[0] as number,
  serverTime: (m: OscMessage): number => m.args[1] as number,
};

export const ClockSample = {
  offset: (m: OscMessage): number => Number(m.args[0]),
  rtt: (m: OscMessage): number => Number(m.args[1]),
};
