/** Where the session id survives across app runs (shared by every tab). */
export const SESSION_KEY = "sc.session";

/** The worker-side claim key for the session's ONE writing (primary)
 *  client — same exclusive-claim machinery as the boxes ("box-" ids can
 *  never collide with it). The loser of the claim shows the session but
 *  neither autosaves nor mirrors harvests. */
export const PRIMARY_CLAIM = "session:primary";

/** How often the session data (boxes + presets) is saved to the backend
 *  (when changed). */
export const SESSION_SAVE_INTERVAL_MS = 10_000;

/** Pause between connection attempts while the server answers 503 ("scsynth
 *  not registered yet"). The server itself long-polls registration for ~1 s
 *  per attempt (CLIENT_ID_WAIT), so this only spaces the round-trips. */
export const SCSYNTH_RETRY_MS = 500;

/** How many quiet 503 retries before the boot overlay gives way to the
 *  error modal ("scsynth may be down" + manual Retry, which restarts the
 *  cycle). Each attempt is the server's ~1 s registration long-poll plus the
 *  retry pause, so the loading state lasts ~5 s before advising. */
export const SCSYNTH_RETRY_LIMIT = 3;
