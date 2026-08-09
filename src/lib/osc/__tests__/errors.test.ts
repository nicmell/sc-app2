import { beforeEach, describe, expect, it, vi } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { TransportEvent } from "@/types/osc";
import { oscClient } from "../OscClient";
import "../middlewares";
import { errors, errorsMiddleware } from "../middlewares/errors";
import { workerClient } from "../worker/WorkerClient";

const next = (): void => {};
beforeEach(() => {
  vi.restoreAllMocks();
  appStore.slice(SliceName.OSC).update((value) => ({ ...value, errors: [] }));
});

describe("errors middleware", () => {
  it("coalesces /fail banners and ignores respawn", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const event: TransportEvent = {
      type: "osc",
      packet: { address: "/fail", args: ["/s_new", "missing"] },
    };
    errorsMiddleware.event!(event, next);
    errorsMiddleware.event!(event, next);
    errorsMiddleware.event!({ type: "respawn" }, next);
    expect(errors.get()[0]).toMatchObject({ address: "/s_new", message: "missing", count: 2 });
    expect(errors.get()).toHaveLength(1);
  });

  it("resets banners on open", () => {
    errorsMiddleware.event!({ type: "error", message: "bad" }, next);
    errorsMiddleware.command!({ type: "open", url: "ws://test" }, next);
    expect(errors.get()).toEqual([]);
  });

  it("resets banners through connect's real open-command chain", async () => {
    errorsMiddleware.event!({ type: "error", message: "old" }, next);
    const post = vi
      .spyOn(workerClient as unknown as { post(command: unknown): void }, "post")
      .mockImplementation(() => {});
    const connecting = oscClient.connect("ws://test", {
      sessionGroupId: 1,
      nodeIdBase: 100,
      nodeIdCount: 100,
      scopeIndexBase: 0,
      scopeIndexCount: 8,
    });
    expect(post).toHaveBeenCalledWith({ type: "open", url: "ws://test" });
    expect(errors.get()).toEqual([]);
    (
      oscClient as unknown as { handleTransportEvent(event: { type: "close" }): void }
    ).handleTransportEvent({ type: "close" });
    await expect(connecting).rejects.toThrow("websocket closed before open");
  });
});
