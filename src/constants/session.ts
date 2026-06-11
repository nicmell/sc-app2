/** Where the session id survives across app runs (shared by every tab). */
export const SESSION_KEY = "sc.session";

/** How often the dashboard layout is saved to the backend (when changed). */
export const LAYOUT_SAVE_INTERVAL_MS = 10_000;

/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

/** Max coalesced error banners kept (oldest dropped). */
export const MAX_ERRORS = 20;
