/** Where the session id survives across app runs (shared by every tab). */
export const SESSION_KEY = "sc.session";

/** How often the dashboard layout is saved to the backend (when changed). */
export const LAYOUT_SAVE_INTERVAL_MS = 10_000;

/** Pause between connection attempts while the server answers 503 ("scsynth
 *  not registered yet"). The server itself long-polls registration for ~5 s
 *  per attempt, so this only spaces the round-trips. */
export const SCSYNTH_RETRY_MS = 1_000;
