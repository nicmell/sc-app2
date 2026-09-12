/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

/** How long the worker-side watchdog waits for a `/status.reply` before
 *  treating the connection as dead. The Rust bridge heartbeats scsynth at
 *  1 s and fans every reply out to us, so 5 s of silence mirrors its own
 *  missed-replies slack. */
export const STATUS_REPLY_TIMEOUT_MS = 5_000;

/** How long a `once()` reply waiter holds out before rejecting — sequenced
 *  commands (`/d_recv` → `/synced`, `/s_new` → `/n_go`) fail loudly instead
 *  of wedging the plugin load. */
export const REPLY_TIMEOUT_MS = 3_000;

// ── transport status ──────────────────────────────────────────────────────

/** Connection states. The numbering deliberately mirrors WebSocket
 *  `readyState` — plus -1 for "never opened",
 *  so the main-thread proxy can mirror it exactly. */
export const TRANSPORT_STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
} as const;

export type TransportStatus = (typeof TRANSPORT_STATUS)[keyof typeof TRANSPORT_STATUS];

// ── audio clock (see AUDIO-CLOCK.md) ──────────────────────────────────────

/** SendTrig trigger id of the `__global_clock__` synth loaded by
 *  scripts/sc-startup.scd — its `/tr` ticks are the main thread's
 *  METRONOME (they drive every `subscribeClock` callback). Mirrored by the
 *  synthdef-compiler parity fixture. */
export const CLOCK_TRIGGER_ID = 4242;
/** The clock synth's tick rate. Must stay at or above TWICE the finest
 *  `subscribeClock` cadence a consumer asks for — zyklus asks the
 *  sc-strudel setInterval shim for 100 ms. The VALUE's owner is
 *  sc-startup.scd's `Impulse.kr` — keep the two in lockstep. */
export const CLOCK_TICK_FREQ_HZ = 20;

// ── bridge clock (see docs/clock.md) ──────────────────────────────────────

/** Ping cadence while the socket is open. The ping/pong is now ONLY the
 *  wall-time anchor for `sendAt` (StrudelDirt consumes wall-clock
 *  timetags — AUDIO-CLOCK.md §5.2); the metronome is the audio clock's
 *  `/tr` above. Crystal drift is ~100 ppm, so a 2 s re-measure keeps the
 *  anchor within fractions of a millisecond. */
export const CLOCK_PING_INTERVAL_MS = 2_000;
/** Recent-sample ring the estimate is picked from (min-RTT rule, applied
 *  by the main-thread ClockSync over the worker's raw samples) — 8 is
 *  NTP's clock-filter register size (~16 s of congestion memory at the
 *  2 s cadence). */
export const CLOCK_SAMPLE_WINDOW = 8;
/** Worker-side heartbeat watchdog poll cadence, derived: detection latency
 *  is the reply timeout plus at most one poll interval, so a fifth keeps it
 *  tight. */
export const CLOCK_WATCHDOG_INTERVAL_MS = STATUS_REPLY_TIMEOUT_MS / 5;
