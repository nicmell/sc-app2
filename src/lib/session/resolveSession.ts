// Session RESOLUTION for the route loaders: mint/revive over HTTP and keep the
// URL truthful — "/" replace-redirects to the stored /:sessionId (or a freshly
// minted one), and a dead or unknown /:sessionId mints a fresh session and
// replace-redirects again. The loaders own every localStorage write; the live
// connection is SessionLayout's job (`SessionManager.connect` on the loader's
// SessionInfo). A live session still dies with its WebSocket — the id is
// persisted identity only.

import { SCSYNTH_RETRY_LIMIT, SCSYNTH_RETRY_MS, SESSION_KEY } from "@/constants/session";
import { get, HttpError, post } from "@/lib/http";
import { refreshPlugins } from "@/stores/plugins";
import type { SessionInfo } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router";
import { replace } from "react-router";

/** Mint a fresh session. The server allocates the group id + node range;
 *  503 = scsynth not registered (the bounded quiet-retry case). */
async function createSession(): Promise<SessionInfo> {
  return await (await post("/api/session")).json();
}

/** Revive a stored session id (GET returns its info + saved layout), or
 *  `null` on failure — the caller falls back to minting a fresh one. A 503
 *  propagates instead: scsynth isn't registered, so the fallback POST would
 *  only burn a second registration long-poll to learn the same thing. */
async function fetchSession(id: string): Promise<SessionInfo | null> {
  try {
    return await (await get(`/api/session/${id}`)).json();
  } catch (error) {
    if (error instanceof HttpError && error.status === 503) throw error;
    return null;
  }
}

/** Retry 503s quietly ("scsynth not registered yet" — the user simply hasn't
 *  started it) within the bounded budget; the router shows the connecting
 *  fallback meanwhile. Exhaustion (or any other failure) throws into the route
 *  errorElement, whose Retry re-navigates with a fresh budget. */
async function with503Retry<T>(fn: () => Promise<T>): Promise<T> {
  let attempts = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        error.status !== 503 ||
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

export async function rootLoader() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return replace(`/${stored}`); // validity is sessionLoader's problem

  const info = await with503Retry(createSession);
  localStorage.setItem(SESSION_KEY, info.sessionId);
  handoff = info;
  return replace(`/${info.sessionId}`);
}

export async function sessionLoader({ params }: LoaderFunctionArgs) {
  // The plugin registry must be in the store before any <sc-plugin> boots —
  // the element reads `plugins.get()` synchronously. Failure degrades to an
  // empty list (boxes show "no plugin assigned"), never a dead session.
  await refreshPlugins().catch((error: unknown) => {
    console.warn("[session] plugin registry load failed:", error);
  });
  const sessionId = params.sessionId;
  if (!sessionId) return replace("/");

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

  const fresh = await with503Retry(createSession);
  localStorage.setItem(SESSION_KEY, fresh.sessionId);
  handoff = fresh;
  return replace(`/${fresh.sessionId}`);
}
