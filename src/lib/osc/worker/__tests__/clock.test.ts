import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOCK_PING_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_PING_BURST_COUNT, CLOCK_PING_BURST_INTERVAL_MS } from "@/constants/osc";
import { WorkerClock } from "../clock";

afterEach(() => vi.useRealTimers());

describe("WorkerClock", () => {
  it("bursts on every open, resets status, and computes offset in Date.now domain", () => {
    vi.useFakeTimers();
    let mono = 100;
    const statuses: Array<[number, number]> = [];
    const pings: OscMessage[] = [];
    const clock = new WorkerClock({
      onStatus: (offset, rtt) => statuses.push([offset, rtt]),
      sendPing: (message) => pings.push(message),
      monotonicNow: () => mono,
    });

    clock.onOpen();
    expect(statuses[0]).toEqual([0, 0]);
    expect(pings[0]).toMatchObject({
      address: CLOCK_PING_ADDRESS,
      args: [0],
    });
    vi.advanceTimersByTime(CLOCK_PING_BURST_INTERVAL_MS * (CLOCK_PING_BURST_COUNT - 1));
    expect(pings).toHaveLength(CLOCK_PING_BURST_COUNT);

    // Send/receipt are monotonic, d1/srv are UNIX time: 20 ms RTT and +30 ms offset.
    mono = 120;
    clock.onPong({ address: "/clock/pong", args: [0, 1_000_020] }, 1_000_000);
    expect(statuses.at(-1)).toEqual([30, 20]);

    mono = 500;
    clock.onOpen();
    expect(statuses.at(-1)).toEqual([0, 0]);
    expect(pings.at(-1)?.args).toEqual([CLOCK_PING_BURST_COUNT]);
    clock.onClose();
  });

  it("ignores stale pongs and clears pending sends on open", () => {
    vi.useFakeTimers();
    let mono = 10;
    const statuses: Array<[number, number]> = [];
    const pings: OscMessage[] = [];
    const clock = new WorkerClock({
      onStatus: (offset, rtt) => statuses.push([offset, rtt]),
      sendPing: (message) => pings.push(message),
      monotonicNow: () => mono,
    });

    clock.onOpen();
    const statusCount = statuses.length;
    clock.onPong({ address: "/clock/pong", args: [999, 1_000] }, 900);
    expect(statuses).toHaveLength(statusCount);

    const oldSeq = pings[0].args[0] as number;
    mono = 20;
    clock.onOpen();
    clock.onPong({ address: "/clock/pong", args: [oldSeq, 1_000] }, 900);
    expect(statuses).toHaveLength(statusCount + 1);
    clock.onClose();
  });

  it("uses absolute phase to correct timer drift, and stop() ends the stream", () => {
    vi.useFakeTimers();
    let mono = 0;
    const ticks: number[] = [];
    const clock = new WorkerClock({
      onStatus: () => {},
      sendPing: () => {},
      monotonicNow: () => mono,
    });

    const stop = clock.subscribe(100, (n) => ticks.push(n));
    mono = 130; // callback itself arrives 30 ms late
    vi.advanceTimersByTime(100);
    expect(ticks).toEqual([1]);
    mono = 200;
    vi.advanceTimersByTime(70); // next deadline remains phase0 + 2*interval
    expect(ticks).toEqual([1, 2]);

    stop();
    mono = 500;
    vi.advanceTimersByTime(300);
    expect(ticks).toEqual([1, 2]); // stopped
  });
});
