// scsynth reply addresses the app routes on. Command addresses live with their
// constructors in @sc-app/server-commands — not duplicated here.
export const OSC_REPLIES = {
  STATUS: "/status.reply",
  FAIL: "/fail",
  LATE: "/late",
} as const;

/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

/** Max coalesced error banners kept (oldest dropped). */
export const MAX_ERRORS = 20;

/** How long the client waits for a `/status.reply` before treating the
 *  connection as dead and closing it. The Rust bridge heartbeats scsynth at
 *  1 s and fans every reply out to us, so 5 s of silence mirrors its own
 *  missed-replies slack. */
export const STATUS_REPLY_TIMEOUT_MS = 5_000;

/** How long a `once()` reply waiter holds out before rejecting — sequenced
 *  commands (`/d_recv` → `/synced`, `/s_new` → `/n_go`) fail loudly instead
 *  of wedging the plugin load. */
export const REPLY_TIMEOUT_MS = 3_000;

// ── bridge clock ─────────────────────────────────────────────────────

export const CLOCK_PING_BURST_COUNT = 5;
export const CLOCK_PING_BURST_INTERVAL_MS = 150;
export const CLOCK_PING_INTERVAL_MS = 2_000;
export const CLOCK_SAMPLE_WINDOW = 8;
export const CLOCK_OFFSET_STEP_THRESHOLD_MS = 50;
export const CLOCK_OFFSET_SLEW_FACTOR = 0.2;
export const CLOCK_WATCHDOG_INTERVAL_MS = 1_000;

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
