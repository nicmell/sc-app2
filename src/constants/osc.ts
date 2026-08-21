/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

/** How long the client waits for a `/status.reply` before treating the
 *  connection as dead and closing it. The Rust bridge heartbeats scsynth at
 *  1 s and fans every reply out to us, so 5 s of silence mirrors its own
 *  missed-replies slack. */
export const STATUS_REPLY_TIMEOUT_MS = 5_000;

/** How long a `once()` reply waiter holds out before rejecting — sequenced
 *  commands (`/d_recv` → `/synced`, `/s_new` → `/n_go`) fail loudly instead
 *  of wedging the plugin load. */
export const REPLY_TIMEOUT_MS = 3_000;

// ── bridge clock (see CLOCK.md) ──────────────────────────────────────

/** Pings fired back-to-back on socket open so the offset estimator locks
 *  fast (~0.6 s) instead of waiting out the steady cadence. */
export const CLOCK_PING_BURST_COUNT = 5;
/** Spacing inside the burst — must exceed the worst-case RTT so a ping never
 *  queues behind the previous one (queueing inflates its own RTT sample). */
export const CLOCK_PING_BURST_INTERVAL_MS = 150;
/** Steady re-sync cadence, sized for clock drift: at a worst-case ~100 ppm
 *  crystal, ms-level precision over the 8-sample window needs a sample about
 *  every 1 ms / 100 ppm / 8 ≈ 1.25 s. */
export const CLOCK_PING_INTERVAL_MS = 2_000;
/** Recent-sample ring the estimate is picked from (min-RTT rule) — 8 is
 *  NTP's clock-filter register size. */
export const CLOCK_SAMPLE_WINDOW = 8;
/** Watchdog poll cadence, derived: detection latency is the reply timeout
 *  plus at most one poll interval, so a fifth keeps it tight. */
export const CLOCK_WATCHDOG_INTERVAL_MS = STATUS_REPLY_TIMEOUT_MS / 5;

// ── scope taps (<sc-scope> defaults) ──────────────────────────────────

/** Default tap input: SuperDirt sums all orbits to the stereo master out
 *  (bus 0/1). */
export const SCOPE_INPUT_BUS = 0;

export const SCOPE_CHANNELS = 2;

/** Default frames per scope slot = one chunk = the visible window
 *  (~21 ms at 48 kHz); <sc-scope frames="…"> overrides per element. */
export const SCOPE_CHUNK_SIZE = 1024;

/** Ceiling for <sc-scope frames>: ScopeOut2 allocates the slot at maxFrames
 *  from scsynth's finite SHM scope pool, and past this the page-flip refresh
 *  (sampleRate/frames) is too slow to read as motion anyway (~3 Hz at 48 kHz). */
export const SCOPE_MAX_FRAMES = 16384;

// ── live envelopes (<sc-env> state / per-synth control arrays) ────────

/** Max segments a LIVE envelope may hold. Its def-side control array is
 *  4 + 4×maxSegments param slots (the flat Env encoding), written whole with
 *  /n_setn on the owning group. */
export const ENV_MAX_SEGMENTS = 15;

/** Default <sc-env max-segments> for a state envelope. */
export const ENV_DEFAULT_MAX_SEGMENTS = 8;
