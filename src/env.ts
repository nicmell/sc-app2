// Environment base-URL resolution, done once at startup and cached.
//
// In a browser the API + WS are same-origin (production serve) or Vite-proxied,
// so relative URLs work. Inside the Tauri webview the origin is
// `tauri://localhost`, not the HTTP server, so we target it explicitly on
// `http://127.0.0.1:<port>` — the port from the `get_env` IPC (see lib.rs).
//
// `initEnv()` resolves the base once (call it at boot, before anything fetches
// or connects — see main.tsx); `httpBase()` / `wsUrl()` then read it synchronously.

import { isTauri, invoke } from "@tauri-apps/api/core";

/** What the Tauri backend's `get_env` command returns. */
interface Env {
  port: number;
}

let base: string | null = null;

/** Resolve the HTTP base URL once. Idempotent. Must complete before any
 *  `httpBase()` / `wsUrl()` call (main.tsx awaits it before startup). */
export async function initEnv(): Promise<void> {
  if (base !== null) return;
  if (isTauri()) {
    const env = await invoke<Env>("get_env");
    base = `http://127.0.0.1:${env.port}`;
  } else {
    base = ""; // same-origin / Vite-proxied — relative URLs
  }
}

/** The resolved HTTP base: `http://127.0.0.1:<port>` in Tauri, `""` (relative)
 *  in a browser. Throws if `initEnv()` hasn't completed. */
export function httpBase(): string {
  if (base === null) throw new Error("env not initialized: call initEnv() first");
  return base;
}

/** A `ws(s)://…` URL for a server path (e.g. `/ws?session=<id>`), built from the
 *  resolved base (Tauri) or the page origin (browser). */
export function wsUrl(path: string): string {
  if (base === null) throw new Error("env not initialized: call initEnv() first");
  if (base) return base.replace(/^http/, "ws") + path; // Tauri: explicit host
  const url = new URL(path, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.href;
}
