// The app's HTTP layer (modeled on the old sc-app's src/lib/http): typed
// request helpers over fetch, all resolving against HTTP_BASE_URL.
//
// In a browser the API + WS are same-origin (production serve) or Vite-proxied,
// so the base is "" and relative URLs work. Inside the Tauri webview the origin
// is `tauri://localhost`, not the HTTP server, so the Rust side injects
// `window.HTTP_BASE_URL = "http://127.0.0.1:<port>"` via an initialization
// script before any frontend code runs (see src-tauri lib.rs run_gui and
// @/constants/env, which reads it).

import type { ValidationViolation } from "@sc-validate";
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

/** The backend's structured error envelope (router/error.rs): a stable
 *  kebab-case `code`, the human headline, and — for the plugin spec gate —
 *  the SAME tsify-generated violations the wasm gate returns. */
interface ApiErrorBody {
  code: string;
  message: string;
  violations?: ValidationViolation[];
}

/** The envelope is JSON with string code+message; anything else (ws/assets
 *  text responses, proxy pages, panics) falls back to the raw-text path. */
function parseApiError(body: string | undefined): ApiErrorBody | undefined {
  if (!body) return undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ApiErrorBody).code === "string" &&
      typeof (parsed as ApiErrorBody).message === "string"
    ) {
      return parsed as ApiErrorBody;
    }
  } catch {
    /* not JSON — the text fallback below */
  }
  return undefined;
}

/** A non-2xx response, thrown by every request helper. The constructor parses
 *  the structured envelope out of the body: `message` is the headline (or the
 *  raw text body, or `"<status> <statusText>"`), `code` the stable backend
 *  identifier, `violations` the spec gate's structured list. */
export class HttpError extends Error {
  readonly code?: string;
  readonly violations?: ValidationViolation[];

  constructor(
    public status: number,
    public statusText: string,
    body?: string,
  ) {
    const parsed = parseApiError(body);
    super(parsed?.message ?? (body || `${status} ${statusText}`));
    this.code = parsed?.code;
    this.violations = parsed?.violations;
  }
}

async function request(
  path: string,
  method: string,
  body?: BodyInit | null,
  options?: RequestOptions,
): Promise<Response> {
  const resp = await fetch(`${HTTP_BASE_URL}${path}`, { ...options, method, body });
  if (!resp.ok)
    throw new HttpError(resp.status, resp.statusText, await resp.text().catch(() => ""));
  return resp;
}

export function get(path: string, options?: RequestOptions): Promise<Response> {
  return request(path, "GET", null, options);
}

export function post(
  path: string,
  body?: BodyInit | null,
  options?: RequestOptions,
): Promise<Response> {
  return request(path, "POST", body, options);
}

export function put(
  path: string,
  body?: BodyInit | null,
  options?: RequestOptions,
): Promise<Response> {
  return request(path, "PUT", body, options);
}

export function patch(
  path: string,
  body?: BodyInit | null,
  options?: RequestOptions,
): Promise<Response> {
  return request(path, "PATCH", body, options);
}

export function del(path: string, options?: RequestOptions): Promise<Response> {
  return request(path, "DELETE", null, options);
}
