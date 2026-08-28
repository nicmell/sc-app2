// Session RESOLUTION for the route loader: mint/revive over HTTP and keep the
// URL truthful — the session param is optional, so ONE loader owns every
// shape: no param replace-redirects to the stored /:sessionId (or a freshly
// minted one), and a dead or unknown /:sessionId mints a fresh session and
// replace-redirects again. The loader owns every localStorage write; the live
// connection is Layout's job (`SessionManager.connect` on the loader's
// SessionInfo). A live session still dies with its WebSocket — the id is
// persisted identity only.

import { ROUTES } from "@/constants/routes";
import { SCSYNTH_RETRY_LIMIT, SCSYNTH_RETRY_MS, SESSION_KEY } from "@/constants/session";
import { get, HttpError, post } from "@/lib/http";
import { refreshPlugins } from "@/stores/plugins";
import type { SessionData, SessionInfo } from "@/types/api";
import { generatePath, replace, type LoaderFunctionArgs } from "react-router";

/** The server stores the session payload opaquely — normalize whatever comes
 *  back (missing, pre-rename array, garbage) into a strict SessionData so the
 *  rest of the frontend never defends. */
function normalizeSession(info: SessionInfo): SessionInfo {
  const raw = info.data as unknown;
  const partial =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Partial<SessionData>) : {};
  return {
    ...info,
    data: {
      boxes: Array.isArray(partial.boxes) ? partial.boxes : [],
      presets:
        partial.presets && typeof partial.presets === "object" && !Array.isArray(partial.presets)
          ? partial.presets
          : {},
    },
  };
}

/** Mint a fresh session. The server allocates the group id + node range;
 *  `scsynth-unregistered` 503 = the bounded quiet-retry case. Loader
 *  failures surface in RouteError — no observer toast (notify: false). */
async function createSession(): Promise<SessionInfo> {
  return normalizeSession(await (await post("/api/session", null, { notify: false })).json());
}

/** Revive a stored session id (GET returns its info + saved data).
 *  `null` — the mint fallback — ONLY when the envelope says the id can
 *  never revive: `session-unknown` (no live entry, no saved data) or
 *  `bad-request` (a garbage id that is not a UUID). Everything else
 *  RETHROWS: a transient 500 or network failure must not silently abandon
 *  the stored session and its saved data (it lands in RouteError, whose
 *  Retry re-resolves the SAME id). */
async function fetchSession(id: string): Promise<SessionInfo | null> {
  try {
    return normalizeSession(await (await get(`/api/session/${id}`, { notify: false })).json());
  } catch (error) {
    if (
      error instanceof HttpError &&
      (error.code === "session-unknown" || error.code === "bad-request")
    ) {
      return null;
    }
    throw error;
  }
}

/** Retry the `scsynth-unregistered` envelope quietly (the user simply
 *  hasn't started scsynth) within the bounded budget; the router shows the
 *  loading fallback meanwhile. Code-STRICT: any other failure — including a
 *  raw-text 503 from some hypothetical intermediary — throws into the route
 *  errorElement immediately, whose Retry re-navigates with a fresh budget. */
async function with503Retry<T>(fn: () => Promise<T>): Promise<T> {
  let attempts = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        error.code !== "scsynth-unregistered" ||
        attempts >= SCSYNTH_RETRY_LIMIT
      ) {
        throw error;
      }
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, SCSYNTH_RETRY_MS));
    }
  }
}

/** A session minted by one loader run, consumed by the next (the redirect
 *  target) without a re-GET — also the redirect-loop guard: the mint →
 *  /:freshId hop can never re-enter the revive-failure path. */
let handoff: SessionInfo | null = null;

/** Mint a session and replace-redirect to its truthful URL. */
async function mintAndRedirect() {
  const info = await with503Retry(createSession);
  localStorage.setItem(SESSION_KEY, info.sessionId);
  handoff = info;
  return replace(generatePath(ROUTES.SESSION, { sessionId: info.sessionId }));
}

export async function sessionLoader({ params }: LoaderFunctionArgs) {
  const sessionId = params.sessionId;

  // No id in the URL: point it at the stored session (its loader pass
  // resolves the id for real), or mint one.
  if (!sessionId) {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return replace(generatePath(ROUTES.SESSION, { sessionId: stored }));
    return mintAndRedirect();
  }

  // The plugin registry must be in the store before PluginHost resolves an
  // assignment. Failure degrades to an empty list (boxes show "no plugin
  // assigned"), never a dead session.
  await refreshPlugins().catch((error: unknown) => {
    console.warn("[session] plugin registry load failed:", error);
  });

  if (handoff?.sessionId === sessionId) {
    const info = handoff;
    handoff = null;
    return info;
  }

  const info = await with503Retry(() => fetchSession(sessionId));
  if (info) {
    localStorage.setItem(SESSION_KEY, info.sessionId);
    return info;
  }

  return mintAndRedirect();
}
