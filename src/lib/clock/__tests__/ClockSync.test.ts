import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOCK_PING_ADDRESS, CLOCK_PONG_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_PING_INTERVAL_MS } from "@/constants/osc";
import type { ClockStatus } from "@/types/stores";
import { ClockSync } from "../ClockSync";

afterEach(() => vi.restoreAllMocks());

/** A global-clock /tr message (nodeId, trigger id 4242, phase). */
const trTick = (phase = 0): OscMessage => ({ address: "/tr", args: [99, 4242, phase] });

/** A bridge /clock/pong (seq echoed, srv = bridge Unix wall-clock ms). */
const pong = (seq: number, serverTime: number): OscMessage => ({
  address: CLOCK_PONG_ADDRESS,
  args: [seq, serverTime],
});

function makeSync() {
  const published: ClockStatus[] = [];
  const pings: OscMessage[] = [];
  const sync = new ClockSync({
    publish: (c) => published.push(c),
    sendPing: (m) => pings.push(m),
  });
  const lastSeq = () => pings.at(-1)!.args[0] as number;
  return { sync, published, pings, lastSeq };
}

/** Mock Date.now once and drive it forward through the test. */
function mockNow(start: number): (ms: number) => void {
  let now = start;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  return (ms) => (now += ms);
}

/** Mock performance.now once (rtt's timebase) and drive it forward. */
function mockPerf(start: number): (ms: number) => void {
  let now = start;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  return (ms) => (now += ms);
}

describe("ClockSync estimate (the tick → ping → pong loop)", () => {
  it("pings on the FIRST tick, measures the round-trip, applies min-RTT", () => {
    const advanceWall = mockNow(10_000);
    const advancePerf = mockPerf(100);
    const { sync, published, pings, lastSeq } = makeSync();

    // First tick of the connection → immediate anchor ping.
    sync.onTick(trTick());
    expect(pings).toHaveLength(1);
    expect(pings[0].address).toBe(CLOCK_PING_ADDRESS);

    // 20 ms round-trip; srv says the bridge is 30 ms ahead at midpoint.
    advancePerf(20);
    sync.onPong(pong(lastSeq(), 10_020));
    expect(published[0]).toEqual({ offset: 30, rtt: 20 });
    expect(sync.now()).toBe(10_030);

    // A slower exchange never displaces the fast sample's offset…
    advanceWall(CLOCK_PING_INTERVAL_MS);
    sync.onTick(trTick()); // the riding subscription is due → ping #2
    expect(pings).toHaveLength(2);
    advancePerf(80);
    sync.onPong(pong(lastSeq(), 12_960)); // offset would be 1000
    expect(sync.now()).toBe(12_030);

    // …a faster exchange wins immediately.
    advanceWall(CLOCK_PING_INTERVAL_MS);
    sync.onTick(trTick());
    advancePerf(3);
    sync.onPong(pong(lastSeq(), 14_011)); // offset 11 + 1.5 = 12.5
    expect(sync.now()).toBe(14_012.5);
  });

  it("ignores unknown and replayed pongs", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(0);
    const { sync, published, lastSeq } = makeSync();

    sync.onTick(trTick());
    sync.onPong(pong(999, 10_000)); // never pinged
    expect(published).toHaveLength(0);

    advancePerf(10);
    sync.onPong(pong(lastSeq(), 10_010));
    sync.onPong(pong(lastSeq(), 99_999)); // replay: pending already consumed
    expect(published).toHaveLength(1);
  });

  it("reset clears pending and re-anchors on the next first tick", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(0);
    const { sync, published, pings, lastSeq } = makeSync();

    sync.onTick(trTick());
    const staleSeq = lastSeq();
    sync.reset();
    expect(published.at(-1)).toEqual({ offset: 0, rtt: 0 });

    advancePerf(10);
    sync.onPong(pong(staleSeq, 10_010)); // pending cleared — dead on arrival
    expect(published).toHaveLength(1);

    sync.onTick(trTick()); // fresh connection → immediate ping again
    expect(pings).toHaveLength(2);
    advancePerf(4);
    sync.onPong(pong(lastSeq(), 10_009)); // fresh lock publishes right away
    expect(published.at(-1)).toEqual({ offset: 11, rtt: 4 });
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

  it("audioTime compensates the measured skew, without steps", () => {
    let mono = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mono);
    mockNow(0);
    const { sync } = makeSync();

    // Local clock runs 200 ppm fast: tick arrivals stretch accordingly.
    for (let i = 0; i < 64; i++) {
      mono = i * 50 * (1 + 200e-6);
      sync.onTick(trTick((i * 2205) % 8192));
    }
    expect(sync.tickInfo().locked).toBe(true);

    mono += 20_000; // let the 50 ppm/s slew settle on the target
    sync.audioTime();
    const t0 = sync.audioTime();
    mono += 1_000; // one real second
    const rate = sync.audioTime() - t0; // seconds advanced per second
    expect(rate).toBeGreaterThan(1 - 260e-6);
    expect(rate).toBeLessThan(1 - 140e-6);
  });

  it("pongs are measurement only — they never fire listeners", () => {
    const advance = mockNow(0);
    mockPerf(0);
    const { sync, lastSeq } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb);

    sync.onTick(trTick()); // arms the anchor ping (not yet due for cb)
    expect(cb).not.toHaveBeenCalled();
    advance(500);
    sync.onPong(pong(lastSeq(), 500));
    expect(cb).not.toHaveBeenCalled();
  });
});
