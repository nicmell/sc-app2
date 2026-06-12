// SessionManager boot-retry unit test: while the server answers 503 ("scsynth
// not registered yet"), the manager keeps the "connecting" status and retries
// quietly — but only within the SCSYNTH_RETRY_LIMIT budget, after which the
// error modal advises that no connection is coming (its manual Retry restarts
// the budget). Any other failure flips to "error" at once. The http layer is
// mocked; oscClient is never reached (the session POST fails first), so no
// worker is involved.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));
vi.mock("@/lib/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http")>()),
  post: http.post,
  get: http.get,
  put: http.put,
}));

import { HttpError } from "@/lib/http";
import { SCSYNTH_RETRY_LIMIT, SCSYNTH_RETRY_MS } from "@/constants/session";
import { SessionManager } from "@/lib/session/SessionManager";
import { appStore } from "@/stores/store";

beforeEach(() => {
  vi.useFakeTimers();
  http.post.mockReset();
  http.get.mockReset();
  http.put.mockReset();
  localStorage.clear(); // no stored session id → straight to POST
  appStore.update((s) => ({ ...s, session: { status: "connecting", scsynthAddress: null } }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SessionManager boot", () => {
  it("retries 503s quietly within the budget, then advises with the error modal", async () => {
    http.post.mockRejectedValue(new HttpError(503, "Service Unavailable", "scsynth not registered yet; retry\n"));
    const manager = new SessionManager();

    await manager.start();
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(manager.status.get()).toBe("connecting"); // boot overlay, not the error modal

    // Each interval fires one more quiet attempt, up to the budget…
    for (let attempt = 2; attempt <= 1 + SCSYNTH_RETRY_LIMIT; attempt++) {
      await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS);
      expect(http.post).toHaveBeenCalledTimes(attempt);
    }
    // …whose last failure flips to the error modal, with no further attempts.
    expect(manager.status.get()).toBe("error");
    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS * 5);
    expect(http.post).toHaveBeenCalledTimes(1 + SCSYNTH_RETRY_LIMIT);

    // The modal's manual Retry restarts the quiet-retry budget.
    void manager.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(manager.status.get()).toBe("connecting");
    expect(http.post).toHaveBeenCalledTimes(2 + SCSYNTH_RETRY_LIMIT);
    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS);
    expect(http.post).toHaveBeenCalledTimes(3 + SCSYNTH_RETRY_LIMIT);

    manager.dispose();
  });

  it("the disposed guard stops the quiet-retry loop", async () => {
    http.post.mockRejectedValue(new HttpError(503, "Service Unavailable"));
    const manager = new SessionManager();

    await manager.start();
    manager.dispose();
    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS * 3);
    // The in-flight timer fires, but the disposed guard stops the loop
    // before any further request.
    expect(http.post).toHaveBeenCalledTimes(1);
  });

  it("any other failure flips to the error modal with no auto-retry", async () => {
    http.post.mockRejectedValue(new HttpError(500, "Internal Server Error"));
    const manager = new SessionManager();

    await manager.start();
    expect(manager.status.get()).toBe("error");

    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS * 5);
    expect(http.post).toHaveBeenCalledTimes(1);
    manager.dispose();
  });
});
