import { beforeEach, describe, expect, it } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { log, logging } from "../middlewares/logging";

const next = (): void => {};
beforeEach(() => appStore.slice(SliceName.OSC).update((value) => ({ ...value, log: [] })));

describe("logging middleware", () => {
  it("logs ordinary traffic and applies control-traffic parity", () => {
    logging.command!({ type: "osc", packet: { address: "/n_set", args: [1] } }, next);
    logging.command!({ type: "osc", packet: { address: "/clock/subscribe", args: [1] } }, next);
    logging.event!({ type: "osc", packet: { address: "/fail", args: ["/x", "bad"] } }, next);
    logging.event!({ type: "osc", packet: { address: "/status.reply", args: [] } }, next);
    expect(log.get().map(({ dir, address }) => [dir, address])).toEqual([
      ["tx", "/n_set"],
      ["rx", "/fail"],
    ]);
  });

  it("ignores respawn and preserves the log on open", () => {
    logging.command!({ type: "osc", packet: { address: "/kept", args: [] } }, next);
    logging.event!({ type: "respawn" }, next);
    logging.command!({ type: "open", url: "ws://test" }, next);
    expect(log.get()).toHaveLength(1);
  });
});
