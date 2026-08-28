/**
 * Bridge clock WIRE protocol (see docs/clock.md). Keep in sync with
 * src-tauri/src/core/clock.rs — the bridge answers pings; ping/pong are the
 * ONLY clock messages that exist as OSC. Subscriptions, ticks, and the
 * offset/rtt status are TYPED worker-protocol messages (`clock-subscribe`,
 * `clock-tick`, `clock-status` — see src/types/osc.d.ts), never OSC and
 * never on the wire.
 *
 *   `/clock/ping  seq:i`        — seq echoes back; send time kept worker-side
 *   `/clock/pong  seq:i srv:d`  — srv = bridge Unix wall-clock ms
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const CLOCK_PING_ADDRESS = "/clock/ping";
export const CLOCK_PONG_ADDRESS = "/clock/pong";

export const clockPing = (seq: number): OscMessage => message(CLOCK_PING_ADDRESS, seq);

export const ClockPong = {
  seq: (m: OscMessage): number => m.args[0] as number,
  serverTime: (m: OscMessage): number => m.args[1] as number,
};
