/** Where the session id survives across app runs (shared by every tab). */
export const SESSION_KEY = "sc.session";

/** How often the dashboard layout is saved to the backend (when changed). */
export const LAYOUT_SAVE_INTERVAL_MS = 10_000;

/** Pause between connection attempts while the server answers 503 ("scsynth
 *  not registered yet"). The server itself long-polls registration for ~5 s
 *  per attempt, so this only spaces the round-trips. */
export const SCSYNTH_RETRY_MS = 1_000;

/** How many quiet 503 retries before the boot overlay gives way to the
 *  error modal ("scsynth may be down" + manual Retry, which restarts the
 *  cycle). Each attempt is the server's ~5 s registration long-poll plus the
 *  retry pause, so the loading state lasts ~20 s before advising. */
export const SCSYNTH_RETRY_LIMIT = 3;
