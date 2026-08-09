import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLOCK_PING_ADDRESS,
  CLOCK_STATUS_ADDRESS,
  CLOCK_TICK_ADDRESS,
  clockSubscribe,
  type OscMessage,
} from "@sc-app/server-commands";
import { CLOCK_PING_BURST_COUNT, CLOCK_PING_BURST_INTERVAL_MS } from "@/constants/osc";
import { WorkerClock } from "../clock";

afterEach(() => vi.useRealTimers());

describe("WorkerClock", () => {
  it("bursts on every open, resets status, and computes offset in Date.now domain", () => {
    vi.useFakeTimers();
    let mono = 100;
    const posted: OscMessage[] = [];
    const pings: OscMessage[] = [];
    const clock = new WorkerClock({
      post: (message) => posted.push(message),
      sendPing: (message) => pings.push(message),
      monotonicNow: () => mono,
    });

    clock.onOpen();
    expect(posted[0]).toEqual({ address: CLOCK_STATUS_ADDRESS, args: [0, 0] });
    expect(pings[0]).toMatchObject({
      address: CLOCK_PING_ADDRESS,
      args: [0],
    });
    vi.advanceTimersByTime(CLOCK_PING_BURST_INTERVAL_MS * (CLOCK_PING_BURST_COUNT - 1));
    expect(pings).toHaveLength(CLOCK_PING_BURST_COUNT);

    // Send/receipt are monotonic, d1/srv are UNIX time: 20 ms RTT and +30 ms offset.
    mono = 120;
    clock.onPong({ address: "/clock/pong", args: [0, 1_000_020] }, 1_000_000);
    expect(posted.at(-1)).toEqual({ address: CLOCK_STATUS_ADDRESS, args: [30, 20] });

    mono = 500;
    clock.onOpen();
    expect(posted.at(-1)).toEqual({ address: CLOCK_STATUS_ADDRESS, args: [0, 0] });
    expect(pings.at(-1)?.args).toEqual([CLOCK_PING_BURST_COUNT]);
    clock.onClose();
  });

  it("ignores stale pongs and clears pending sends on open", () => {
    vi.useFakeTimers();
    let mono = 10;
    const posted: OscMessage[] = [];
    const pings: OscMessage[] = [];
    const clock = new WorkerClock({
      post: (message) => posted.push(message),
      sendPing: (message) => pings.push(message),
      monotonicNow: () => mono,
    });

    clock.onOpen();
    const statusCount = posted.length;
    clock.onPong({ address: "/clock/pong", args: [999, 1_000] }, 900);
    expect(posted).toHaveLength(statusCount);

    const oldSeq = pings[0].args[0] as number;
    mono = 20;
    clock.onOpen();
    clock.onPong({ address: "/clock/pong", args: [oldSeq, 1_000] }, 900);
    expect(posted).toHaveLength(statusCount + 1);
    clock.onClose();
  });

  it("uses low-RTT samples and absolute phase to correct timer drift", () => {
    vi.useFakeTimers();
    let mono = 0;
    const posted: OscMessage[] = [];
    const clock = new WorkerClock({
      post: (message) => posted.push(message),
      sendPing: () => {},
      monotonicNow: () => mono,
    });

    clock.handleCommand(clockSubscribe(7, 100));
    mono = 130; // callback itself arrives 30 ms late
    vi.advanceTimersByTime(100);
    expect(posted.at(-1)).toEqual({ address: CLOCK_TICK_ADDRESS, args: [7, 1] });
    mono = 200;
    vi.advanceTimersByTime(70); // next deadline remains phase0 + 2*interval
    expect(posted.at(-1)).toEqual({ address: CLOCK_TICK_ADDRESS, args: [7, 2] });
  });
});
