// The bridge clock's worker half (WorkerClock): the uniform ping loop with
// raw-sample measurement, and the heartbeat watchdog (the filtering half is
// lib/clock's ClockSync.test.ts).
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOCK_PING_ADDRESS, CLOCK_SAMPLE_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import {
  CLOCK_PING_INTERVAL_MS,
  CLOCK_WATCHDOG_INTERVAL_MS,
  STATUS_REPLY_TIMEOUT_MS,
} from "@/constants/osc";
import { WorkerClock } from "../clock";

afterEach(() => vi.useRealTimers());

function makeClock() {
  const posted: OscMessage[] = [];
  const pings: OscMessage[] = [];
  const onDead = vi.fn();
  let mono = 0;
  const clock = new WorkerClock({
    post: (m) => posted.push(m),
    sendPing: (m) => pings.push(m),
    onDead,
    monotonicNow: () => mono,
  });
  return { clock, posted, pings, onDead, setMono: (v: number) => (mono = v) };
}

describe("WorkerClock pings", () => {
  it("pings at the uniform cadence and posts one raw sample per pong", () => {
    vi.useFakeTimers();
    const { clock, posted, pings, setMono } = makeClock();

    setMono(100);
    clock.start();
    expect(pings[0]).toMatchObject({ address: CLOCK_PING_ADDRESS, args: [0] });
    vi.advanceTimersByTime(CLOCK_PING_INTERVAL_MS);
    expect(pings).toHaveLength(2);

    // Send/receipt are monotonic, d1/srv are UNIX time: 20 ms RTT, +30 ms offset.
    setMono(120);
    clock.onPong({ address: "/clock/pong", args: [0, 1_000_020] }, 1_000_000);
    expect(posted).toEqual([{ address: CLOCK_SAMPLE_ADDRESS, args: [30, 20] }]);
    clock.stop();
  });

  it("ignores stale pongs and clears pending sends on start", () => {
    vi.useFakeTimers();
    const { clock, posted, pings, setMono } = makeClock();

    setMono(10);
    clock.start();
    clock.onPong({ address: "/clock/pong", args: [999, 1_000] }, 900);
    expect(posted).toHaveLength(0);

    const oldSeq = pings[0].args[0] as number;
    setMono(20);
    clock.start(); // pending cleared — the old seq no longer matches
    clock.onPong({ address: "/clock/pong", args: [oldSeq, 1_000] }, 900);
    expect(posted).toHaveLength(0);
    const freshSeq = pings.at(-1)!.args[0] as number;
    clock.onPong({ address: "/clock/pong", args: [freshSeq, 1_000] }, 900);
    expect(posted).toHaveLength(1);
    clock.stop();
  });

  it("stop() halts pinging silently", () => {
    vi.useFakeTimers();
    const { clock, posted, pings } = makeClock();
    clock.start();
    const sent = pings.length;
    clock.stop();
    vi.advanceTimersByTime(10_000);
    expect(pings).toHaveLength(sent);
    expect(posted).toHaveLength(0);
  });
});

describe("WorkerClock watchdog", () => {
  it("fires onDead ONCE when heartbeats go stale, stopping itself first", () => {
    vi.useFakeTimers();
    const { clock, pings, onDead, setMono } = makeClock();

    clock.start();
    setMono(STATUS_REPLY_TIMEOUT_MS + 1);
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    expect(onDead).toHaveBeenCalledTimes(1);

    // Stopped: no further pings, no second onDead.
    const sent = pings.length;
    vi.advanceTimersByTime(10_000);
    expect(onDead).toHaveBeenCalledTimes(1);
    expect(pings).toHaveLength(sent);
  });

  it("stays quiet while markAlive keeps stamping heartbeats", () => {
    vi.useFakeTimers();
    const { clock, onDead, setMono } = makeClock();

    clock.start();
    let mono = 0;
    for (let i = 0; i < 10; i++) {
      mono += CLOCK_WATCHDOG_INTERVAL_MS;
      setMono(mono);
      clock.markAlive();
      vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    }
    expect(onDead).not.toHaveBeenCalled();
    clock.stop();
  });

  it("never fires after stop()", () => {
    vi.useFakeTimers();
    const { clock, onDead, setMono } = makeClock();
    clock.start();
    clock.stop();
    setMono(STATUS_REPLY_TIMEOUT_MS * 2);
    vi.advanceTimersByTime(STATUS_REPLY_TIMEOUT_MS * 2);
    expect(onDead).not.toHaveBeenCalled();
  });
});
