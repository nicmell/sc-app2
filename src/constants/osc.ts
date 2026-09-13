import { CLOCK_TICK_ADDRESS, type OscMessage } from "@sc-app/server-commands";

/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

/** How much tick silence the worker-side watchdog tolerates before
 *  declaring the session dead: the heartbeat is the global clock's
 *  `/clock/tick` (20 Hz), so 5 s = 100 missed ticks. This also ENFORCES the clock-synth
 *  requirement — a stack that never loads `__global_clock__` gets a clean
 *  close with a clear error instead of a zombie session with a silent
 *  metronome. */
export const WATCHDOG_TIMEOUT_MS = 5_000;

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

/** THE clock-tick discriminator: the global clock's `/clock/tick`
 *  (SendReply — a plain address match; `/tr` belongs entirely to the
 *  plugins now). One predicate, three consumers — ClockSync's routing,
 *  the rx-log skip, the worker watchdog's markAlive stamp — so "exactly
 *  the global clock's tick" is single-sourced. */
export const isClockTick = (message: OscMessage): boolean => message.address === CLOCK_TICK_ADDRESS;
/** PulseCount's tick index stays f32-EXACT up to here (2^24 ticks ≈ 9.7
 *  days of engine uptime at 20 Hz); beyond, the tracker sees the
 *  degraded steps as a restart and resyncs. Owner: sc-startup.scd's
 *  SendReply graph. */
export const TICK_COUNT_EXACT = 1 << 24;
/** The clock synth's tick rate. Must stay at or above TWICE the finest
 *  `clock.subscribe` cadence a consumer asks for — zyklus asks the
 *  sc-strudel setInterval shim for 100 ms. The VALUE's owner is
 *  sc-startup.scd's `Impulse.kr` (feeding the /clock/tick SendReply) —
 *  keep the two in lockstep. */
export const CLOCK_TICK_FREQ_HZ = 20;
/** The clock synth's Phasor ring length in samples — the modulus of the
 *  phase payload each `/tr` tick carries. Owner: sc-startup.scd's
 *  `Phasor.ar(..., end: 8192)`; mirrored by the parity fixture. */
export const PHASE_RING_FRAMES = 8192;

// ── bridge clock (see docs/clock.md) ──────────────────────────────────────

/** Nominal ping cadence — quantized to the tick metronome it rides (a
 *  ClockSync tick countdown, so pings flow only while ticks do). The
 *  ping/pong is ONLY the wall anchor behind `clock.now()` — the header
 *  clock and cross-host diagnostics; nothing musical (AUDIO-CLOCK.md
 *  §5.2 is RESOLVED: dirt events carry a relative delta); the metronome is
 *  the audio clock's `/clock/tick` above. Crystal drift is ~100 ppm, so a 2 s
 *  re-measure keeps the anchor within fractions of a millisecond. */
export const CLOCK_PING_INTERVAL_MS = 2_000;
/** Recent-sample ring the estimate is picked from (min-RTT rule, applied
 *  by ClockSync over its ping/pong samples) — 8 is NTP's clock-filter
 *  register size (~16 s of congestion memory at the 2 s cadence). */
export const CLOCK_SAMPLE_WINDOW = 8;
/** Worker-side heartbeat watchdog poll cadence, derived: detection latency
 *  is the reply timeout plus at most one poll interval, so a fifth keeps it
 *  tight. */
export const CLOCK_WATCHDOG_INTERVAL_MS = WATCHDOG_TIMEOUT_MS / 5;
