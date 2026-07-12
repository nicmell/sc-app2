// Loader unit tests: the mint/revive resolution, the localStorage ownership,
// the mint → redirect handoff (no re-GET, no redirect loop), and the bounded
// quiet 503 retry ("scsynth not registered yet") whose exhaustion throws into
// the route errorElement. The http layer is mocked; no router is involved —
// loaders are plain functions returning data or a replace() Response.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import type { SessionInfo } from "@/types/api";

const http = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}));
vi.mock("@/lib/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http")>()),
  post: http.post,
  get: http.get,
}));
vi.mock("@/stores/plugins", () => ({
  refreshPlugins: vi.fn(() => Promise.resolve()),
}));

import { SCSYNTH_RETRY_LIMIT, SCSYNTH_RETRY_MS, SESSION_KEY } from "@/constants/session";
import { HttpError } from "@/lib/http";
import { rootLoader, sessionLoader } from "@/lib/session/resolveSession";

function info(sessionId: string): SessionInfo {
  return {
    sessionId,
    sessionGroupId: 10,
    nodeIdBase: 100,
    nodeIdCount: 20,
    scopeIndexBase: 2,
    scopeIndexCount: 4,
    scsynthAddress: "127.0.0.1:57110",
    layout: [],
  };
}

function jsonResponse(value: unknown): { json: () => Promise<unknown> } {
  return { json: () => Promise.resolve(value) };
}

function loadSession(sessionId: string): Promise<unknown> {
  return sessionLoader({ params: { sessionId } } as unknown as LoaderFunctionArgs);
}

/** Loader redirects are replace() Responses; assert the target. */
function expectReplaceTo(result: unknown, location: string): void {
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).headers.get("Location")).toBe(location);
}

beforeEach(() => {
  http.post.mockReset();
  http.get.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rootLoader", () => {
  it("replace-redirects to the stored session id without touching the network", async () => {
    localStorage.setItem(SESSION_KEY, "stored-1");
    expectReplaceTo(await rootLoader(), "/stored-1");
    expect(http.post).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
  });

  it("mints a session when nothing is stored, persists the id, and redirects", async () => {
    http.post.mockResolvedValue(jsonResponse(info("fresh-1")));
    expectReplaceTo(await rootLoader(), "/fresh-1");
    expect(localStorage.getItem(SESSION_KEY)).toBe("fresh-1");
    // The minted session rides the handoff to the redirect target's loader —
    // no re-GET for the id we just created.
    const result = await loadSession("fresh-1");
    expect((result as SessionInfo).sessionId).toBe("fresh-1");
    expect(http.get).not.toHaveBeenCalled();
  });
});

describe("sessionLoader", () => {
  it("revives the URL's session and persists its id", async () => {
    http.get.mockResolvedValue(jsonResponse(info("url-1")));
    const result = await loadSession("url-1");
    expect((result as SessionInfo).sessionId).toBe("url-1");
    expect(localStorage.getItem(SESSION_KEY)).toBe("url-1");
  });

  it("mints a fresh session when the URL's id is dead, then hands it off without a re-GET", async () => {
    http.get.mockRejectedValue(new HttpError(404, "Not Found", "unknown session\n"));
    http.post.mockResolvedValue(jsonResponse(info("fresh-2")));
    expectReplaceTo(await loadSession("dead-1"), "/fresh-2");
    expect(localStorage.getItem(SESSION_KEY)).toBe("fresh-2");

    const result = await loadSession("fresh-2");
    expect((result as SessionInfo).sessionId).toBe("fresh-2");
    expect(http.get).toHaveBeenCalledTimes(1); // only the dead id was ever GET
  });

  it("retries 503s quietly within the budget, then throws to the errorElement", async () => {
    vi.useFakeTimers();
    http.get.mockRejectedValue(
      new HttpError(503, "Service Unavailable", "scsynth not registered yet; retry\n"),
    );
    const pending = loadSession("url-1");
    const outcome = pending.then(
      () => {
        throw new Error("should have thrown");
      },
      (error: unknown) => error,
    );
    // One initial attempt + one per elapsed interval, up to the budget.
    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS * SCSYNTH_RETRY_LIMIT);
    expect(http.get).toHaveBeenCalledTimes(1 + SCSYNTH_RETRY_LIMIT);
    expect(await outcome).toBeInstanceOf(HttpError);
    // The 503 never falls back to minting — POST would just burn a second
    // registration long-poll.
    expect(http.post).not.toHaveBeenCalled();
  });
});
