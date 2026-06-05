// Session bootstrap + URL helpers.
//
// The bridge gates the WebSocket on a session id (see src-tauri router/session):
// `POST /api/session` mints one — allocating a scsynth group + node-id range for
// this session — and `/ws?session=<id>` validates it. We reuse a stored id
// across reloads when it's still live (the server keeps the same group/range),
// else mint a fresh one.
//
// In a browser the API + WS are same-origin (production serve) or proxied
// (Vite dev), so relative URLs work. Inside the Tauri webview the origin is
// `tauri://localhost`, so we target the HTTP server explicitly on
// `127.0.0.1:<port>` (port from the `get_config` IPC command).

import { isTauri, invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "sc.session";

/** The server-assigned session identity + node-id allocation. */
export interface SessionInfo {
  sessionId: string;
  /** scsynth group this session's synths must live under. */
  sessionGroupId: number;
  /** First node id the frontend may allocate for this session. */
  nodeIdBase: number;
  /** How many node ids the frontend may allocate. */
  nodeIdCount: number;
}

export type BootstrapResult = SessionInfo & { wsUrl: string };

/** `http://127.0.0.1:<port>` in Tauri, `""` (relative) in a browser. Shared by
 *  the plugin loader so plugins are always fetched from the Rust HTTP router
 *  (never Tauri IPC). */
export async function httpBase(): Promise<string> {
  if (isTauri()) {
    const { port } = await invoke<{ port: number }>("get_config");
    return `http://127.0.0.1:${port}`;
  }
  return "";
}

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
  const res = await fetch(`${await httpBase()}/api/config`);
  if (!res.ok) throw new Error(`GET /api/config → ${res.status}`);
  return res.json();
}

/** Build the `/ws?session=` URL for the current environment. */
async function wsUrlFor(sessionId: string): Promise<string> {
  if (isTauri()) {
    const { port } = await invoke<{ port: number }>("get_config");
    return `ws://127.0.0.1:${port}/ws?session=${sessionId}`;
  }
  const url = new URL("/ws", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("session", sessionId);
  return url.href;
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
  const base = await httpBase();
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  let info = stored ? await fetchSession(base, stored) : null;
  if (!info) {
    info = await createSession(base);
    window.sessionStorage.setItem(STORAGE_KEY, info.sessionId);
  }
  return { ...info, wsUrl: await wsUrlFor(info.sessionId) };
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
