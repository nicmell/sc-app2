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

// ── scope taps (<sc-scope> defaults) ──────────────────────────────────

/** Default tap input: SuperDirt sums all orbits to the stereo master out
 *  (bus 0/1). */
export const SCOPE_INPUT_BUS = 0;

export const SCOPE_CHANNELS = 2;

/** Frames per scope slot = one chunk (~21 ms at 48 kHz). */
export const SCOPE_CHUNK_SIZE = 1024;
