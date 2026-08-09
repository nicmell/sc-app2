/**
 * Bridge clock protocol. Keep in sync with src-tauri/src/core/clock.rs.
 *
 * Worker/bridge: `/clock/ping seq:i`, `/clock/pong seq:i srv:d`.
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

export const clockPing = (seq: number): OscMessage => message(CLOCK_PING_ADDRESS, seq);
export const clockSubscribe = (id: number, intervalMs: number): OscMessage =>
  message(CLOCK_SUBSCRIBE_ADDRESS, id, intervalMs);
export const clockUnsubscribe = (id: number): OscMessage => message(CLOCK_UNSUBSCRIBE_ADDRESS, id);
export const clockTick = (id: number, n: number): OscMessage => message(CLOCK_TICK_ADDRESS, id, n);
export const clockStatus = (offset: number, rtt: number): OscMessage =>
  message(CLOCK_STATUS_ADDRESS, offset, rtt);

export const ClockPong = {
  seq: (m: OscMessage): number => m.args[0] as number,
  serverTime: (m: OscMessage): number => m.args[1] as number,
};

export const ClockTick = {
  id: (m: OscMessage): number => m.args[0] as number,
  index: (m: OscMessage): number => m.args[1] as number,
};

export const ClockStatus = {
  offset: (m: OscMessage): number => Number(m.args[0]),
  rtt: (m: OscMessage): number => Number(m.args[1]),
};
