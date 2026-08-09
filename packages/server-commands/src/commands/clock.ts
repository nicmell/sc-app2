/**
 * Bridge clock protocol. Keep in sync with src-tauri/src/core/clock.rs.
 *
 * Worker/bridge: `/clock/ping seq:i t0:d`, `/clock/pong seq:i t0:d srv:d`.
 * Webview/worker: subscribe/unsubscribe commands and tick/status replies.
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const CLOCK_PING_ADDRESS = "/clock/ping";
export const CLOCK_PONG_ADDRESS = "/clock/pong";
export const CLOCK_SUBSCRIBE_ADDRESS = "/clock/subscribe";
export const CLOCK_UNSUBSCRIBE_ADDRESS = "/clock/unsubscribe";
export const CLOCK_TICK_ADDRESS = "/clock/tick";
export const CLOCK_STATUS_ADDRESS = "/clock/status";

export const clockPing = (seq: number, t0: number): OscMessage =>
  message(CLOCK_PING_ADDRESS, seq, { type: "d", value: t0 });
export const clockSubscribe = (id: number, intervalMs: number): OscMessage =>
  message(CLOCK_SUBSCRIBE_ADDRESS, id, intervalMs);
export const clockUnsubscribe = (id: number): OscMessage => message(CLOCK_UNSUBSCRIBE_ADDRESS, id);
export const clockTick = (id: number, n: number): OscMessage => message(CLOCK_TICK_ADDRESS, id, n);
export const clockStatus = (offset: number, rtt: number): OscMessage =>
  message(CLOCK_STATUS_ADDRESS, offset, rtt);

export const ClockPong = {
  seq: (m: OscMessage): number => m.args[0] as number,
  t0: (m: OscMessage): number => m.args[1] as number,
  serverTime: (m: OscMessage): number => m.args[2] as number,
};

export const ClockTick = {
  id: (m: OscMessage): number => m.args[0] as number,
  index: (m: OscMessage): number => m.args[1] as number,
};
