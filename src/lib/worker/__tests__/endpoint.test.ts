// The WorkerEndpoint: the codec, the message-only postMessage boundary
// (at-metadata bundling out, bundle flattening in), and the tick-stamped
// session watchdog — against a fake byte transport (raw socket lifecycle
// is transport.test.ts, the staleness timers watchdog.test.ts).
import { afterEach, describe, expect, it, vi } from "vitest";
import { decode, encode } from "@sc-app/server-commands/codec";
import { CLOCK_PONG_ADDRESS, CLOCK_TICK_ADDRESS, type OscPacket } from "@sc-app/server-commands";
import { CLOCK_WATCHDOG_INTERVAL_MS, WATCHDOG_TIMEOUT_MS } from "@/constants/osc";
import type { TransportEvent } from "@/types/osc";
import { WorkerEndpoint, type TransportLike } from "../endpoint";
import type { WireEvent } from "../transport";

function makeEndpoint() {
  const events: { event: TransportEvent; transfer?: Transferable[] }[] = [];
  const sent: Uint8Array[] = [];
  const calls: string[] = [];
  let notify: (e: WireEvent) => void = () => {};
  const transport: TransportLike = {
    open: (url) => calls.push(`open:${url}`),
    close: () => calls.push("close"),
    send: (data) => sent.push(data),
    onEvent: (cb) => {
      notify = cb;
    },
  };
  const endpoint = new WorkerEndpoint(
    (event, transfer) => events.push({ event, transfer }),
    transport,
  );
  const frame = (packet: OscPacket): void =>
    notify({ type: "data", data: encode(packet).slice().buffer });
  return { endpoint, events, sent, calls, frame, emit: (e: WireEvent) => notify(e) };
}

afterEach(() => vi.useRealTimers());

describe("WorkerEndpoint", () => {
  it("routes open/close commands and stays silent on orderly close", () => {
    const { endpoint, events, calls } = makeEndpoint();
    endpoint.handleCommand({ type: "open", url: "ws://a" });
    endpoint.handleCommand({ type: "close" });
    expect(calls).toEqual(["open:ws://a", "close"]);
    expect(events).toHaveLength(0);
  });

  it("counts ONLY the global clock's /clock/tick as a heartbeat", () => {
    vi.useFakeTimers();
    let mono = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mono);
    const { events, frame, emit } = makeEndpoint();
    const errors = () => events.filter(({ event }) => event.type === "error");

    emit({ type: "open" });
    // The global clock's tick keeps the watchdog quiet…
    mono += WATCHDOG_TIMEOUT_MS;
    frame({ address: CLOCK_TICK_ADDRESS, args: [1000, -1, 7, 123] });
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    expect(errors()).toHaveLength(0);

    // …but pongs, /status.reply, and plugin /tr do NOT: only the DSP
    // graph computing proves the session alive.
    mono += WATCHDOG_TIMEOUT_MS + 1;
    frame({ address: CLOCK_PONG_ADDRESS, args: [41, 0, 1_000, 0.5] });
    frame({ address: "/status.reply", args: [1, 2, 3, 4, 0, 0, 0, 48_000, 48_000] });
    frame({ address: "/tr", args: [1000, 7, 123] });
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS * 10);
    expect(errors()).toHaveLength(1);
  });

  it("encodes sends as plain messages — nothing outbound is scheduled", () => {
    const { endpoint, sent } = makeEndpoint();
    endpoint.handleCommand({
      type: "osc",
      packet: { address: "/dirt/play/in", args: [250.5, "s", "bd"] },
    });
    expect(decode(sent[0])).toEqual({ address: "/dirt/play/in", args: [250.5, "s", "bd"] });
  });

  it("passes /clock/ntp/pong straight up — no interception, no clock code", () => {
    vi.useFakeTimers(); // the open event arms the watchdog timer
    const { events, sent, frame, emit } = makeEndpoint();

    emit({ type: "open" });
    // Open sends nothing: the ping originates on the MAIN thread.
    expect(events.map(({ event }) => event)).toEqual([{ type: "open" }]);
    expect(sent).toHaveLength(0);

    frame({ address: CLOCK_PONG_ADDRESS, args: [41, 0, 1_000, 0.5] });
    const pong = events.at(-1)?.event;
    if (pong?.type !== "osc") throw new Error("expected pong");
    expect(pong.packet).toEqual({ address: CLOCK_PONG_ADDRESS, args: [41, 0, 1_000, 0.5] });
  });

  it("decodes frames, flattening bundles to messages with blob transferables", () => {
    const { events, frame } = makeEndpoint();
    frame({
      timetag: 0,
      packets: [
        { address: "/foo", args: [new Uint8Array([1, 2, 3])] },
        { address: "/bar", args: [] },
      ],
    });
    expect(events).toHaveLength(2);
    const [foo, bar] = events;
    if (foo.event.type !== "osc" || bar.event.type !== "osc") throw new Error("expected osc");
    expect(foo.event.packet.address).toBe("/foo");
    expect(foo.event.packet.args[0]).toBeInstanceOf(Uint8Array);
    expect(foo.transfer).toEqual([(foo.event.packet.args[0] as Uint8Array).buffer]);
    expect(bar.event.packet).toEqual({ address: "/bar", args: [] });
    expect(bar.transfer).toEqual([]);
  });

  it("reports an undecodable frame as an error event", () => {
    const { events, emit } = makeEndpoint();
    emit({ type: "data", data: new Uint8Array([1, 2, 3, 4]).slice().buffer });
    expect(events).toHaveLength(1);
    expect(events[0].event.type).toBe("error");
  });

  it("relays error and remote close events", () => {
    const { events, emit } = makeEndpoint();
    emit({ type: "error", message: "websocket error" });
    emit({ type: "close", code: 1006, reason: undefined });
    expect(events.map(({ event }) => event)).toEqual([
      { type: "error", message: "websocket error" },
      { type: "close", code: 1006, reason: undefined },
    ]);
  });
});
