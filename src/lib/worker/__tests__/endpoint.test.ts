// The WorkerEndpoint: the codec, the message-only postMessage boundary
// (at-metadata bundling out, bundle flattening in), and the /clock/*
// routing — against a fake byte transport (raw socket lifecycle is
// transport.test.ts, the timers clock.test.ts).
import { afterEach, describe, expect, it, vi } from "vitest";
import { decode, encode } from "@sc-app/server-commands/codec";
import {
  atDate,
  CLOCK_PING_ADDRESS,
  CLOCK_PONG_ADDRESS,
  CLOCK_SAMPLE_ADDRESS,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import { CLOCK_WATCHDOG_INTERVAL_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
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

  it("surfaces stale heartbeats as a transport error (worker-side watchdog)", () => {
    vi.useFakeTimers();
    let mono = 0;
    vi.spyOn(performance, "now").mockImplementation(() => mono);
    const { events, frame, emit } = makeEndpoint();
    const errors = () => events.filter(({ event }) => event.type === "error");

    emit({ type: "open" });
    // A fresh /status.reply keeps the watchdog quiet…
    mono += STATUS_REPLY_TIMEOUT_MS;
    frame({ address: "/status.reply", args: [1, 2, 3, 4, 0, 0, 0, 48_000, 48_000] });
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS);
    expect(errors()).toHaveLength(0);

    // …silence past the timeout kills the session, once.
    mono += STATUS_REPLY_TIMEOUT_MS + 1;
    vi.advanceTimersByTime(CLOCK_WATCHDOG_INTERVAL_MS * 10);
    expect(errors()).toHaveLength(1);
  });

  it("encodes sends, building the OSC bundle from the `at` metadata", () => {
    const { endpoint, sent } = makeEndpoint();
    endpoint.handleCommand({ type: "osc", packet: { address: "/dirt/play", args: [] } });
    endpoint.handleCommand({
      type: "osc",
      packet: { address: "/dirt/play", args: [] },
      at: 10_750,
    });
    expect(decode(sent[0])).toEqual({ address: "/dirt/play", args: [] });
    expect(decode(sent[1])).toEqual(
      decode(encode({ timetag: atDate(10_750), packets: [{ address: "/dirt/play", args: [] }] })),
    );
  });

  it("feeds the sampler on open and consumes its pong into a /clock/sample", () => {
    vi.useFakeTimers(); // the open event starts the ping loop
    const { events, sent, frame, emit } = makeEndpoint();

    emit({ type: "open" });
    // The sampler's ping goes out encoded on the ordinary send path.
    expect(events.map(({ event }) => event)).toEqual([{ type: "open" }]);
    expect(sent).toHaveLength(1);
    expect((decode(sent[0]) as OscMessage).address).toBe(CLOCK_PING_ADDRESS);

    frame({ address: CLOCK_PONG_ADDRESS, args: [0, 1_000] });
    const sample = events.at(-1)?.event;
    if (sample?.type !== "osc") throw new Error("expected sample");
    expect(sample.packet.address).toBe(CLOCK_SAMPLE_ADDRESS);
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
