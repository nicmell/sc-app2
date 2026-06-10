// The app's HTTP layer (modeled on the old sc-app's src/lib/http): typed
// request helpers over fetch, all resolving against HTTP_BASE_URL.
//
// In a browser the API + WS are same-origin (production serve) or Vite-proxied,
// so the base is "" and relative URLs work. Inside the Tauri webview the origin
// is `tauri://localhost`, not the HTTP server, so the Rust side injects
// `window.HTTP_BASE_URL = "http://127.0.0.1:<port>"` via an initialization
// script before any frontend code runs (see src-tauri lib.rs run_gui and
// @/constants/env, which reads it).

import { HTTP_BASE_URL } from "@/constants/env";

/** A `ws(s)://…` URL for a server path (e.g. `/ws?session=<id>`), derived from
 *  HTTP_BASE_URL (Tauri) or the page origin (browser). */
export function wsUrl(path: string): string {
  if (HTTP_BASE_URL) return HTTP_BASE_URL.replace(/^http/, "ws") + path;
  const url = new URL(path, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.href;
}

type RequestOptions = Omit<RequestInit, "method" | "body">;

/** A non-2xx response, thrown by every request helper. `message` is the
 *  response body when the server sent one (e.g. plugin validation errors),
 *  else `"<status> <statusText>"`. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    body?: string,
  ) {
    super(body || `${status} ${statusText}`);
  }
}

async function request(
  path: string,
  method: string,
  body?: BodyInit | null,
  options?: RequestOptions,
): Promise<Response> {
  const resp = await fetch(`${HTTP_BASE_URL}${path}`, { ...options, method, body });
  if (!resp.ok) throw new HttpError(resp.status, resp.statusText, await resp.text().catch(() => ""));
  return resp;
}

export function get(path: string, options?: RequestOptions): Promise<Response> {
  return request(path, "GET", null, options);
}

export function post(path: string, body?: BodyInit | null, options?: RequestOptions): Promise<Response> {
  return request(path, "POST", body, options);
}

export function put(path: string, body?: BodyInit | null, options?: RequestOptions): Promise<Response> {
  return request(path, "PUT", body, options);
}

export function patch(path: string, body?: BodyInit | null, options?: RequestOptions): Promise<Response> {
  return request(path, "PATCH", body, options);
}

export function del(path: string, options?: RequestOptions): Promise<Response> {
  return request(path, "DELETE", null, options);
}
