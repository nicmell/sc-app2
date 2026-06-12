// SessionManager boot-retry unit test: while the server answers 503 ("scsynth
// not registered yet"), the manager must keep the "connecting" status and
// retry quietly — the app may not dead-end just because scsynth isn't started
// yet. Any other failure is real and flips to "error" (the modal with the
// manual Retry). The http layer is mocked; oscClient is never reached (the
// session POST fails first), so no worker is involved.

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
import { SCSYNTH_RETRY_MS } from "@/constants/session";
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
  it("retries quietly while the server 503s (scsynth not registered)", async () => {
    http.post.mockRejectedValue(new HttpError(503, "Service Unavailable", "scsynth not registered yet; retry\n"));
    const manager = new SessionManager();

    await manager.start();
    expect(http.post).toHaveBeenCalledTimes(1);
    expect(manager.status.get()).toBe("connecting"); // boot overlay, not the error modal

    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS);
    expect(http.post).toHaveBeenCalledTimes(2);
    expect(manager.status.get()).toBe("connecting");

    manager.dispose();
    await vi.advanceTimersByTimeAsync(SCSYNTH_RETRY_MS * 3);
    // The in-flight timer fires, but the disposed guard stops the loop
    // before any further request.
    expect(http.post).toHaveBeenCalledTimes(2);
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
