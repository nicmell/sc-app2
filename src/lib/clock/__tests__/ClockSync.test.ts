import { afterEach, describe, expect, it, vi } from "vitest";
import { clockSample, type OscMessage } from "@sc-app/server-commands";
import type { ClockStatus } from "@/types/stores";
import { ClockSync } from "../ClockSync";

afterEach(() => vi.restoreAllMocks());

/** A global-clock /tr message (nodeId, trigger id 4242, phase). */
const trTick = (phase = 0): OscMessage => ({ address: "/tr", args: [99, 4242, phase] });

function makeSync() {
  const published: ClockStatus[] = [];
  const sync = new ClockSync({ publish: (c) => published.push(c) });
  return { sync, published };
}

/** Mock Date.now once and drive it forward through the test. */
function mockNow(start: number): (ms: number) => void {
  let now = start;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  return (ms) => (now += ms);
}

describe("ClockSync estimate", () => {
  it("applies the min-RTT rule over the sample window", () => {
    mockNow(10_000);
    const { sync, published } = makeSync();

    sync.onSample(clockSample(30, 20));
    expect(sync.now()).toBe(10_030);
    // A slower exchange never displaces the fast sample's offset.
    sync.onSample(clockSample(999, 80));
    expect(sync.now()).toBe(10_030);
    // A faster exchange wins immediately.
    sync.onSample(clockSample(12.5, 3));
    expect(sync.now()).toBe(10_012.5);
    expect(published[0]).toEqual({ offset: 30, rtt: 20 });
  });

  it("publishes every sample and resets to the unlocked estimate", () => {
    const advance = mockNow(10_000);
    const { sync, published } = makeSync();

    sync.onSample(clockSample(30, 20));
    advance(550);
    sync.onSample(clockSample(12.5, 3));
    expect(published).toEqual([
      { offset: 30, rtt: 20 },
      { offset: 12.5, rtt: 3 },
    ]);

    sync.reset();
    expect(sync.now()).toBe(10_550);
    expect(published.at(-1)).toEqual({ offset: 0, rtt: 0 });
    sync.onSample(clockSample(7, 1)); // fresh lock publishes right away
    expect(published.at(-1)).toEqual({ offset: 7, rtt: 1 });
  });
});

describe("ClockSync tick-driven callbacks", () => {
  it("fires listeners at their cadence, quantized to tick arrival", () => {
    const advance = mockNow(0);
    const { sync } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb);

    for (let i = 0; i < 8; i++) {
      advance(50); // the 20 Hz tick cadence
      sync.onTick(trTick());
    }
    // 400 ms elapsed at a 100 ms interval → 4 fires.
    expect(cb).toHaveBeenCalledTimes(4);
  });

  it("never bursts after a gap — one fire, then realign", () => {
    const advance = mockNow(0);
    const { sync } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb);

    advance(1_000); // long stall (disconnect, engine hiccup)
    sync.onTick(trTick());
    expect(cb).toHaveBeenCalledTimes(1);

    advance(50);
    sync.onTick(trTick());
    expect(cb).toHaveBeenCalledTimes(1); // realigned: next due a full interval later
    advance(50);
    sync.onTick(trTick());
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("off() unregisters exactly one listener; reset keeps them", () => {
    const advance = mockNow(0);
    const { sync } = makeSync();
    const a = vi.fn();
    const b = vi.fn();
    const subA = sync.subscribe(100, a);
    sync.subscribe(100, b);

    subA.off();
    subA.off(); // second off is a no-op
    sync.reset(); // listeners survive the estimate reset
    advance(100);
    sync.onTick(trTick());
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("feeds the one-way tracker: audioNow locks after enough phased ticks", () => {
    let mono = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mono);
    mockNow(0);
    const { sync } = makeSync();

    expect(sync.audioNow()).toBeNull();
    for (let i = 0; i < 40; i++) {
      mono = i * 50;
      sync.onTick(trTick((i * 2205) % 8192));
    }
    expect(sync.tickInfo().locked).toBe(true);
    expect(sync.audioNow()).not.toBeNull();
    sync.reset();
    expect(sync.audioNow()).toBeNull();
  });

  it("samples are measurement only — they never fire listeners", () => {
    const advance = mockNow(0);
    const { sync } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb);

    for (let i = 0; i < 8; i++) {
      advance(50);
      sync.onSample(clockSample(0, 1));
    }
    expect(cb).not.toHaveBeenCalled();
  });
});
