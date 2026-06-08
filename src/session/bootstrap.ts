// Session bootstrap.
//
// The bridge gates the WebSocket on a session id (see src-tauri router/session):
// `POST /api/session` mints one — allocating a scsynth group + node-id range for
// this session — and `/ws?session=<id>` validates it. We reuse a stored id
// across reloads when it's still live (the server keeps the same group/range),
// else mint a fresh one.
//
// All URLs are built from the resolved base in `env.ts` (relative in a browser,
// `http://127.0.0.1:<port>` in the Tauri webview).

import { httpBase, wsUrl } from "../env";
import type { BootstrapResult, SessionInfo } from "@sc-app/session-core";

export type { BootstrapResult, SessionInfo } from "@sc-app/session-core";

const STORAGE_KEY = "sc.session";

/** A bridge peer as reported by `/api/config` (e.g. scsynth, strudel). */
export interface ServerPeer {
  name: string;
  pattern: string;
  target: string;
}

/** The subset of `AppConfig` the frontend reads. */
export interface ServerConfig {
  port: number;
  peers: ServerPeer[];
}

/** Fetch the server config from the Rust router (`/api/config`). The footer
 *  uses it to show scsynth's address. */
export async function fetchConfig(): Promise<ServerConfig> {
  const res = await fetch(`${httpBase()}/api/config`);
  if (!res.ok) throw new Error(`GET /api/config → ${res.status}`);
  return res.json();
}

/** Fetch a stored session's info, or `null` if it's gone (404 / network). */
async function fetchSession(base: string, id: string): Promise<SessionInfo | null> {
  try {
    const res = await fetch(`${base}/api/session/${id}`);
    return res.ok ? ((await res.json()) as SessionInfo) : null;
  } catch {
    return null;
  }
}

/** Mint a fresh session. The server allocates the group + node range; it can
 *  briefly return 503 if scsynth hasn't finished registering, so retry. */
async function createSession(base: string): Promise<SessionInfo> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${base}/api/session`, { method: "POST" });
    if (res.ok) return (await res.json()) as SessionInfo;
    if (res.status !== 503) throw new Error(`POST /api/session → ${res.status}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("POST /api/session → 503 (scsynth not registered)");
}

async function doBootstrap(): Promise<BootstrapResult> {
  const base = httpBase();
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  let info = stored ? await fetchSession(base, stored) : null;
  if (!info) {
    info = await createSession(base);
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
