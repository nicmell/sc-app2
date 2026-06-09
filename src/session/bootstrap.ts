// Session bootstrap.
//
// The bridge gates the WebSocket on a session id (see src-tauri router/session):
// `POST /api/session` mints one — allocating a scsynth group + node-id range for
// this session — and `/ws?session=<id>` validates it. We reuse a stored id
// across reloads when it's still live (the server keeps the same group/range),
// else mint a fresh one.
//
// All requests go through `src/http`, which resolves against the injected
// HTTP_BASE_URL (Tauri) or same-origin relative URLs (browser).

import { get, post, wsUrl, HttpError } from "../http";
import type { BootstrapResult, SessionInfo } from "./bootstrapTypes";

export type { BootstrapResult, SessionInfo } from "./bootstrapTypes";

const STORAGE_KEY = "sc.session";

/** Fetch a stored session's info, or `null` if it's gone (404 / network). */
async function fetchSession(id: string): Promise<SessionInfo | null> {
  try {
    return (await get(`/api/session/${id}`)).json();
  } catch {
    return null;
  }
}

/** Mint a fresh session. The server allocates the group + node range; it can
 *  briefly return 503 if scsynth hasn't finished registering, so retry. */
async function createSession(): Promise<SessionInfo> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await (await post("/api/session")).json();
    } catch (err) {
      if (!(err instanceof HttpError) || err.status !== 503) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("POST /api/session → 503 (scsynth not registered)");
}

async function doBootstrap(): Promise<BootstrapResult> {
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  let info = stored ? await fetchSession(stored) : null;
  if (!info) {
    info = await createSession();
    window.sessionStorage.setItem(STORAGE_KEY, info.sessionId);
  }
  return { ...info, wsUrl: wsUrl(`/ws?session=${info.sessionId}`) };
}

/** Reuse a stored, still-live session id, else mint and store a new one.
 *  Returns the session info + the WS URL to open for it.
 *
 *  The in-flight promise is cached so concurrent callers share one bootstrap —
 *  notably React StrictMode (dev) mounts effects twice. */
let inFlight: Promise<BootstrapResult> | null = null;

export function bootstrapSession(): Promise<BootstrapResult> {
  if (!inFlight) {
    inFlight = doBootstrap().catch((err) => {
      inFlight = null; // let a later mount retry after a failure
      throw err;
    });
  }
  return inFlight;
}
