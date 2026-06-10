// Session bootstrap.
//
// The bridge gates the WebSocket on a session id (see src-tauri router/session):
// `POST /api/session` mints one — allocating a scsynth group id + node-id range
// for this session — and `/ws?session=<id>` validates it. A session lives
// exactly as long as its WebSocket (the server ends it on close), so every
// bootstrap mints a fresh one; nothing is persisted across reloads.
//
// All requests go through `src/http`, which resolves against the injected
// HTTP_BASE_URL (Tauri) or same-origin relative URLs (browser).

import { post, wsUrl, HttpError } from "../http";
import type { BootstrapResult, SessionInfo } from "./bootstrapTypes";

export type { BootstrapResult, SessionInfo } from "./bootstrapTypes";

/** Mint a fresh session. The server allocates the group id + node range; it
 *  can briefly return 503 if scsynth hasn't finished registering, so retry. */
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
  const info = await createSession();
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
