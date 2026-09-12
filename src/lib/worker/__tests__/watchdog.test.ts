// The session heartbeat watchdog: markAlive-driven staleness detection on
// worker timers. The heartbeat SOURCE (the global clock's /tr) is the
// endpoint's concern — endpoint.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOCK_WATCHDOG_INTERVAL_MS, WATCHDOG_TIMEOUT_MS } from "@/constants/osc";
import { Watchdog } from "../watchdog";

afterEach(() => vi.useRealTimers());

function makeWatchdog() {
  const onDead = vi.fn();
  let mono = 0;
  const watchdog = new Watchdog({ onDead, monotonicNow: () => mono });
  return { watchdog, onDead, setMono: (v: number) => (mono = v) };
}

describe("Watchdog", () => {
  it("fires onDead ONCE when heartbeats go stale, stopping itself first", () => {
    vi.useFakeTimers();
    const { watchdog, onDead, setMono } = makeWatchdog();

    watchdog.start();
    setMono(WATCHDOG_TIMEOUT_MS + 1);
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    expect(onDead).toHaveBeenCalledTimes(1);

    // Stopped: no second onDead however long the silence continues.
    vi.advanceTimersByTime(WATCHDOG_TIMEOUT_MS * 10);
    expect(onDead).toHaveBeenCalledTimes(1);
  });

  it("stays quiet while markAlive keeps stamping heartbeats", () => {
    vi.useFakeTimers();
    const { watchdog, onDead, setMono } = makeWatchdog();

    watchdog.start();
    let mono = 0;
    for (let i = 0; i < 10; i++) {
      mono += CLOCK_WATCHDOG_INTERVAL_MS;
      setMono(mono);
      watchdog.markAlive();
      vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    }
    expect(onDead).not.toHaveBeenCalled();
    watchdog.stop();
  });

  it("start() re-arms with a full timeout of grace", () => {
    vi.useFakeTimers();
    const { watchdog, onDead, setMono } = makeWatchdog();

    watchdog.start();
    setMono(WATCHDOG_TIMEOUT_MS); // one tick short of stale
    watchdog.start(); // fresh socket — grace restarts from here
    vi.advanceTimersByTime(WATCHDOG_TIMEOUT_MS);
    expect(onDead).not.toHaveBeenCalled();

    setMono(WATCHDOG_TIMEOUT_MS * 2 + 1);
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    expect(onDead).toHaveBeenCalledTimes(1);
  });

  it("never fires after stop()", () => {
    vi.useFakeTimers();
    const { watchdog, onDead, setMono } = makeWatchdog();
    watchdog.start();
    watchdog.stop();
    setMono(WATCHDOG_TIMEOUT_MS * 2);
    vi.advanceTimersByTime(WATCHDOG_TIMEOUT_MS * 2);
    expect(onDead).not.toHaveBeenCalled();
  });
});
