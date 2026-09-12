/**
 * Bridge clock protocol (see docs/clock.md) — the wall-time anchor pair.
 * Keep in sync with src-tauri/src/core/clock.rs (the exact /clock/pong
 * wire bytes are pinned in both languages' test suites).
 *
 * Main ⇄ bridge (through the worker, no interception):
 *   `/clock/ping  seq:i`        — sent by the MAIN thread on its tick
 *                                 metronome; send time kept main-side
 *   `/clock/pong  seq:i srv:d`  — srv = bridge Unix wall-clock ms; flows
 *                                 back to OscClient.handleReply as an
 *                                 ordinary message
 *
 * The postMessage boundary carries NO clock vocabulary at all; the
 * metronome is the audio engine's /tr tick (AUDIO-CLOCK.md).
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
