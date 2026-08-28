import { beforeEach, describe, expect, it } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { log, loggingMiddleware } from "../middlewares/logging";

const next = (): void => {};
const SESSION = {
  sessionGroupId: 1,
  nodeIdBase: 100,
  nodeIdCount: 100,
  scopeIndexBase: 0,
  scopeIndexCount: 8,
};
beforeEach(() => appStore.slice(SliceName.OSC).update((value) => ({ ...value, log: [] })));

describe("logging middleware", () => {
  it("logs ordinary traffic and applies control-traffic parity", () => {
    loggingMiddleware.command!({ type: "osc", packet: { address: "/n_set", args: [1] } }, next);
    loggingMiddleware.command!(
      { type: "osc", packet: { address: "/clock/subscribe", args: [1] } },
      next,
    );
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
    loggingMiddleware.command!(
      { type: "join", url: "ws://test", sessionId: "s1", session: SESSION },
      next,
    );
    expect(log.get()).toHaveLength(1);
  });
});
