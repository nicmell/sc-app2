// Session bootstrap + URL helpers.
//
// The bridge gates the WebSocket on a session id (see src-tauri/src/session.rs):
// `POST /api/session` mints one, `/ws?session=<id>` validates it. We reuse a
// stored id across reloads when it's still live, else mint a fresh one.
//
// In a browser the API + WS are same-origin (production serve) or proxied
// (Vite dev), so relative URLs work. Inside the Tauri webview the origin is
// `tauri://localhost`, so we target the HTTP server explicitly on
// `127.0.0.1:<port>` (port from the `get_config` IPC command; CSP is null,
// so cross-origin fetch/WS to localhost is allowed).

import { isTauri, invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "sc.session";

/** `http://127.0.0.1:<port>` in Tauri, `""` (relative) in a browser. */
async function httpBase(): Promise<string> {
  if (isTauri()) {
    const { port } = await invoke<{ port: number }>("get_config");
    return `http://127.0.0.1:${port}`;
  }
  return "";
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

async function sessionExists(base: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/session/${id}`);
    return res.ok;
  } catch {
    return false;
  }
}

async function createSession(base: string): Promise<string> {
  const res = await fetch(`${base}/api/session`, { method: "POST" });
  if (!res.ok) throw new Error(`POST /api/session → ${res.status}`);
  const { sessionId } = (await res.json()) as { sessionId: string };
  return sessionId;
}

/** Reuse a stored, still-live session id, else mint and store a new one.
 *  Returns the id and the WS URL to open for it. */
export async function bootstrapSession(): Promise<{ sessionId: string; wsUrl: string }> {
  const base = await httpBase();
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  let sessionId = stored && (await sessionExists(base, stored)) ? stored : null;
  if (!sessionId) {
    sessionId = await createSession(base);
    window.sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  return { sessionId, wsUrl: await wsUrlFor(sessionId) };
}
