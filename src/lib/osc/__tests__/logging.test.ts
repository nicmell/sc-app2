import { beforeEach, describe, expect, it } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { log, loggingMiddleware } from "../middlewares/logging";

const next = (): void => {};
beforeEach(() => appStore.slice(SliceName.OSC).update((value) => ({ ...value, log: [] })));

describe("logging middleware", () => {
  it("logs ordinary traffic and applies control-traffic parity", () => {
    loggingMiddleware.command!({ type: "osc", packet: { address: "/n_set", args: [1] } }, next);
    // Clock traffic is typed protocol, never `osc` — structurally unlogged.
    loggingMiddleware.command!({ type: "clock-subscribe", id: 1, intervalMs: 100 }, next);
    loggingMiddleware.event!({ type: "clock-tick", id: 1, n: 1 }, next);
    loggingMiddleware.event!(
      { type: "osc", packet: { address: "/fail", args: ["/x", "bad"] } },
      next,
    );
    loggingMiddleware.event!({ type: "osc", packet: { address: "/status.reply", args: [] } }, next);
    expect(log.get().map(({ dir, address, args }) => [dir, address, args])).toEqual([
      ["tx", "/n_set", ["1"]],
      ["rx", "/fail", ["/x", "bad"]],
    ]);
  });

  it("ignores respawn and preserves the log on open", () => {
    loggingMiddleware.command!({ type: "osc", packet: { address: "/kept", args: [] } }, next);
    loggingMiddleware.event!({ type: "respawn" }, next);
    loggingMiddleware.command!({ type: "open", url: "ws://test" }, next);
    expect(log.get()).toHaveLength(1);
  });
});
