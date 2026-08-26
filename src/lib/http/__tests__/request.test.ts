// The global http-error observer: UNEXPECTED server failures (>= 500,
// excluding the loaders' 503 domain) push a coalesced toast unless the call
// opted out with `notify: false`; 4xx stays caller-owned; fetch REJECTIONS
// never reach the observer (documented blind spot). Every case still throws.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get, HttpError } from "@/lib/http";

const toasts = vi.hoisted(() => ({ pushToast: vi.fn() }));
vi.mock("@/stores/toasts", () => toasts);

function response(status: number, statusText: string, body: string): Response {
  return {
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  toasts.pushToast.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  // restoreMocks does NOT undo stubGlobal.
  vi.unstubAllGlobals();
});

describe("the http error observer", () => {
  it("toasts a 500 envelope with the method/path context, coalesced per call", async () => {
    fetchMock.mockResolvedValue(
      response(500, "Internal Server Error", JSON.stringify({ code: "internal", message: "boom" })),
    );
    await expect(get("/api/plugins")).rejects.toBeInstanceOf(HttpError);
    expect(toasts.pushToast).toHaveBeenCalledWith({
      variant: "error",
      key: "http:GET:/api/plugins",
      message: "GET /api/plugins: boom",
    });
  });

  it("toasts non-envelope 5xx too (the dev-proxy empty 500)", async () => {
    fetchMock.mockResolvedValue(response(502, "Bad Gateway", ""));
    await expect(get("/api/diag/tree")).rejects.toBeInstanceOf(HttpError);
    expect(toasts.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "GET /api/diag/tree: 502 Bad Gateway" }),
    );
  });

  it("stays silent on 503 — the loaders' quiet-retry domain", async () => {
    fetchMock.mockResolvedValue(
      response(
        503,
        "Service Unavailable",
        JSON.stringify({ code: "scsynth-unregistered", message: "scsynth not registered yet" }),
      ),
    );
    await expect(get("/api/session/x")).rejects.toBeInstanceOf(HttpError);
    expect(toasts.pushToast).not.toHaveBeenCalled();
  });

  it("stays silent on 4xx — caller-owned form feedback", async () => {
    fetchMock.mockResolvedValue(
      response(404, "Not Found", JSON.stringify({ code: "plugin-not-found", message: "nope" })),
    );
    await expect(get("/api/plugins/x")).rejects.toBeInstanceOf(HttpError);
    expect(toasts.pushToast).not.toHaveBeenCalled();
  });

  it("honors notify: false and strips it from the fetch init", async () => {
    fetchMock.mockResolvedValue(
      response(500, "Internal Server Error", JSON.stringify({ code: "internal", message: "x" })),
    );
    await expect(get("/api/session/1", { notify: false })).rejects.toBeInstanceOf(HttpError);
    expect(toasts.pushToast).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("notify");
  });

  it("never sees fetch rejections — no toast, no HttpError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Load failed"));
    await expect(get("/api/plugins")).rejects.toThrow(TypeError);
    expect(toasts.pushToast).not.toHaveBeenCalled();
  });
});
