// scsynth reply addresses the app routes on. Command addresses live with their
// constructors in @sc-app/server-commands — not duplicated here.
export const OSC_REPLIES = {
  STATUS: "/status.reply",
  FAIL: "/fail",
  LATE: "/late",
} as const;

// ── master-out scope tap ──────────────────────────────────────────────

/** SuperDirt sums all orbits to the stereo master out (bus 0/1). */
export const SCOPE_INPUT_BUS = 0;

export const SCOPE_CHANNELS = 2;

/** Frames per scope slot = one chunk (~21 ms at 48 kHz). */
export const SCOPE_CHUNK_SIZE = 1024;

/** Fixed subscription id (one subscription per WS connection). */
export const SCOPE_SUB_ID = 1;
