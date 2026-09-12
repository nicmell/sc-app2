import { beforeEach, describe, expect, it } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { scsynthStatus, statusMiddleware } from "../middlewares/status";

const next = (): void => {};
beforeEach(() =>
  appStore.slice(SliceName.OSC).update((value) => ({ ...value, scsynthStatus: null })),
);

describe("status middleware", () => {
  it("mirrors scsynth status", () => {
    statusMiddleware.event!(
      {
        type: "osc",
        packet: { address: "/status.reply", args: [1, 2, 3, 4, 0, 12, 20, 48_000, 47_999] },
      },
      next,
    );
    expect(scsynthStatus.get()).toMatchObject({
      avgCpu: 12,
      peakCpu: 20,
      sampleRate: 47_999,
      numUgens: 2,
    });
  });

  it("resets scsynth status on open and ignores respawn", () => {
    statusMiddleware.event!(
      {
        type: "osc",
        packet: { address: "/status.reply", args: [1, 2, 3, 4, 0, 12, 20, 48_000, 47_999] },
      },
      next,
    );
    statusMiddleware.event!({ type: "respawn" }, next);
    expect(scsynthStatus.get()).not.toBeNull();
    statusMiddleware.command!({ type: "open", url: "ws://test" }, next);
    expect(scsynthStatus.get()).toBeNull();
  });
});
