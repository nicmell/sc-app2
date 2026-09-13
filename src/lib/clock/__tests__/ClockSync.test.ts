import { afterEach, describe, expect, it, vi } from "vitest";
import { CLOCK_PING_ADDRESS, CLOCK_PONG_ADDRESS, type OscMessage } from "@sc-app/server-commands";
import { CLOCK_PING_INTERVAL_MS, CLOCK_TICK_FREQ_HZ } from "@/constants/osc";
import type { ClockStatus } from "@/types/stores";
import { ClockSync } from "../ClockSync";

afterEach(() => vi.restoreAllMocks());

/** The anchor-ping cadence in ticks (2 s at 20 Hz = 40). */
const PING_TICKS = Math.round(CLOCK_PING_INTERVAL_MS / (1000 / CLOCK_TICK_FREQ_HZ));

/** A global-clock /tr message (nodeId, trigger id 4242, phase). */
const trTick = (phase = 0): OscMessage => ({ address: "/tr", args: [99, 4242, phase] });

/** An sclang /clock/pong (clientId+seq echoed; the wall timestamp split
 *  as [secs:i, fracMs:f] — serverTime here is Unix ms for readability). */
const pong = (clientId: number, seq: number, serverTime: number): OscMessage => ({
  address: CLOCK_PONG_ADDRESS,
  args: [clientId, seq, Math.floor(serverTime / 1000), serverTime % 1000],
});

function makeSync() {
  const published: (ClockStatus | null)[] = [];
  const pings: OscMessage[] = [];
  const sync = new ClockSync({
    publish: (c) => published.push(c),
    sendPing: (m) => pings.push(m),
  });
  sync.setClientId(41); // the server-minted id, armed before any tick
  const clientId = () => pings.at(-1)!.args[0] as number;
  const lastSeq = () => pings.at(-1)!.args[1] as number;
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) sync.handleMessage(trTick());
  };
  return { sync, published, pings, clientId, lastSeq, ticks };
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
  it("pings on the FIRST tick, then every PING_TICKS; min-RTT rules", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(100);
    const { sync, published, pings, clientId, lastSeq, ticks } = makeSync();

    // First tick of the connection → immediate anchor ping.
    sync.handleMessage(trTick());
    expect(pings).toHaveLength(1);
    expect(pings[0].address).toBe(CLOCK_PING_ADDRESS);

    // 20 ms round-trip; srv says the bridge is 30 ms ahead at midpoint.
    advancePerf(20);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_020));
    expect(published[0]).toEqual({ offset: 30, rtt: 20 });
    expect(sync.now()).toBe(10_030);

    // A slower exchange never displaces the fast sample's offset…
    ticks(PING_TICKS); // the countdown rides the metronome → ping #2
    expect(pings).toHaveLength(2);
    advancePerf(80);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_960)); // offset would be 1000
    expect(sync.now()).toBe(10_030);

    // …a faster exchange wins immediately.
    ticks(PING_TICKS);
    expect(pings).toHaveLength(3);
    advancePerf(3);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_011)); // offset 11 + 1.5 = 12.5
    expect(sync.now()).toBe(10_012.5);
  });

  it("ignores unknown and replayed pongs", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(0);
    const { sync, published, clientId, lastSeq } = makeSync();

    sync.handleMessage(trTick());
    sync.handleMessage(pong(clientId(), 999, 10_000)); // never pinged
    expect(published).toHaveLength(0);

    advancePerf(10);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_010));
    sync.handleMessage(pong(clientId(), lastSeq(), 99_999)); // replay: the slot was consumed
    expect(published).toHaveLength(1);
  });

  it("ignores another client's pong (same seq, different clientId)", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(0);
    const { sync, published, clientId, lastSeq } = makeSync();

    sync.handleMessage(trTick());
    advancePerf(10);
    // The fan-out broadcasts every session's pongs — a foreign id with a
    // matching seq must not complete OUR round-trip.
    sync.handleMessage(pong(clientId() ^ 1, lastSeq(), 10_010));
    expect(published).toHaveLength(0);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_010));
    expect(published).toHaveLength(1);
  });

  it("reset unanchors (publishes null) and re-pings on the next first tick", () => {
    mockNow(10_000);
    const advancePerf = mockPerf(0);
    const { sync, published, pings, clientId, lastSeq } = makeSync();

    sync.handleMessage(trTick());
    const staleSeq = lastSeq();
    sync.reset();
    expect(published.at(-1)).toBeNull();

    advancePerf(10);
    sync.handleMessage(pong(clientId(), staleSeq, 10_010)); // slot cleared — dead on arrival
    expect(published).toHaveLength(1);

    sync.handleMessage(trTick()); // fresh connection → immediate ping again
    expect(pings).toHaveLength(2);
    advancePerf(4);
    sync.handleMessage(pong(clientId(), lastSeq(), 10_009)); // fresh lock publishes right away
    expect(published.at(-1)).toEqual({ offset: 11, rtt: 4 });
  });
});

describe("ClockSync tick-driven callbacks", () => {
  it("fires listeners every round(intervalMs / tickPeriod) ticks", () => {
    const { sync, ticks } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb); // 2 ticks at 20 Hz

    ticks(8);
    expect(cb).toHaveBeenCalledTimes(4);
    sync.subscribe(1_000, cb); // 20 ticks — registered mid-stream
    ticks(20);
    expect(cb).toHaveBeenCalledTimes(4 + 10 + 1);
  });

  it("counts ticks, not wall time — a gap can never burst", () => {
    mockNow(0);
    let mono = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mono);
    const { sync } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb); // every 2 ticks

    sync.handleMessage(trTick());
    expect(cb).not.toHaveBeenCalled();
    mono += 10_000; // long stall (disconnect, engine hiccup, wall step)
    sync.handleMessage(trTick());
    expect(cb).toHaveBeenCalledTimes(1); // the 2nd tick, however late — one fire
    sync.handleMessage(trTick());
    expect(cb).toHaveBeenCalledTimes(1);
    sync.handleMessage(trTick());
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("off() unregisters exactly one listener; reset keeps them", () => {
    const { sync, ticks } = makeSync();
    const a = vi.fn();
    const b = vi.fn();
    const offA = sync.subscribe(100, a);
    sync.subscribe(100, b);

    offA();
    offA(); // second off is a no-op
    sync.reset(); // listeners survive the estimate reset
    ticks(2);
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
      sync.handleMessage(trTick((i * 2205) % 8192));
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
      sync.handleMessage(trTick((i * 2205) % 8192));
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
    mockNow(0);
    mockPerf(0);
    const { sync, clientId, lastSeq } = makeSync();
    const cb = vi.fn();
    sync.subscribe(100, cb);

    sync.handleMessage(trTick()); // arms the anchor ping (1 of the 2 ticks due)
    expect(cb).not.toHaveBeenCalled();
    sync.handleMessage(pong(clientId(), lastSeq(), 500));
    expect(cb).not.toHaveBeenCalled();
  });
});
