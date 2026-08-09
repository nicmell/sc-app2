import { beforeEach, describe, expect, it } from "vitest";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { clock, scsynthStatus, status } from "../middlewares/status";

const next = (): void => {};
beforeEach(() =>
  appStore.slice(SliceName.OSC).update((value) => ({ ...value, scsynthStatus: null, clock: null })),
);

describe("status middleware", () => {
  it("mirrors scsynth and clock status", () => {
    status.event!(
      {
        type: "osc",
        packet: { address: "/status.reply", args: [1, 2, 3, 4, 0, 12, 20, 48_000, 47_999] },
      },
      next,
    );
    status.event!({ type: "osc", packet: { address: "/clock/status", args: [12.5, 3] } }, next);
    expect(scsynthStatus.get()).toMatchObject({
      avgCpu: 12,
      peakCpu: 20,
      sampleRate: 47_999,
      numUgens: 2,
    });
    expect(clock.get()).toEqual({ offset: 12.5, rtt: 3 });
  });

  it("resets only scsynth status on open and ignores respawn", () => {
    status.event!({ type: "osc", packet: { address: "/clock/status", args: [1, 2] } }, next);
    status.event!({ type: "respawn" }, next);
    status.command!({ type: "open", url: "ws://test" }, next);
    expect(scsynthStatus.get()).toBeNull();
    expect(clock.get()).toEqual({ offset: 1, rtt: 2 });
  });
});
