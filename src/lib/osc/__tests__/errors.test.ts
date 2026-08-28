import { beforeEach, describe, expect, it, vi } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportEvent } from "@/types/osc";
import { pushToast, toasts } from "@/stores/toasts";
import { oscClient } from "../OscClient";
import "../middlewares";
import { errorsMiddleware } from "../middlewares/errors";
import { workerClient } from "../worker/WorkerClient";

const next = (): void => {};
const SESSION = {
  sessionGroupId: 1,
  nodeIdBase: 100,
  nodeIdCount: 100,
  scopeIndexBase: 0,
  scopeIndexCount: 8,
};
beforeEach(() => {
  vi.restoreAllMocks();
  appStore.slice(SliceName.TOASTS).set([]);
});

describe("errors middleware", () => {
  it("coalesces /fail toasts and ignores respawn", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const event: TransportEvent = {
      type: "osc",
      packet: { address: "/fail", args: ["/s_new", "missing"] },
    };
    errorsMiddleware.event!(event, next);
    errorsMiddleware.event!(event, next);
    errorsMiddleware.event!({ type: "respawn" }, next);
    expect(toasts.get()[0]).toMatchObject({ message: "/s_new: missing", count: 2 });
    expect(toasts.get()).toHaveLength(1);
  });

  it("resets its own toasts on join, leaving foreign toasts alone", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorsMiddleware.event!({ type: "error", message: "bad" }, next);
    pushToast({ message: "plugin upload failed", variant: "error" });
    errorsMiddleware.command!({ type: "join", url: "ws://test", sessionId: "s1", session: SESSION }, next);
    expect(toasts.get()).toHaveLength(1);
    expect(toasts.get()[0]).toMatchObject({ message: "plugin upload failed" });
  });

  it("resets toasts through connect's real join-command chain", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorsMiddleware.event!({ type: "error", message: "old" }, next);
    const post = vi
      .spyOn(workerClient as unknown as { post(command: unknown): void }, "post")
      .mockImplementation(() => {});
    const connecting = oscClient.connect("ws://test", "s1", SESSION);
    // The join posts after the (lock-free in happy-dom) acquire microtask.
    await Promise.resolve();
    expect(post).toHaveBeenCalledWith({
      type: "join",
      url: "ws://test",
      sessionId: "s1",
      session: SESSION,
      lockName: undefined,
    });
    expect(toasts.get()).toEqual([]);
    (
      oscClient as unknown as { handleTransportEvent(event: { type: "close" }): void }
    ).handleTransportEvent({ type: "close" });
    await expect(connecting).rejects.toThrow("websocket closed before open");
  });
});
