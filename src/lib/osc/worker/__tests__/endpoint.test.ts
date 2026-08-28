// The shared-endpoint gate, driven directly over an injected fake transport
// (no worker, no socket): open-as-join semantics (single socket, replayed
// open for late joiners), close-as-leave with last-port socket close, the
// scope-subId NAT (outbound rewrite, targeted + rewritten inbound chunks,
// leave/socket-close cleanup), per-port clock streams under colliding local
// ids, and destroy() (the liveness seam's full removal).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decode, encode } from "@sc-app/server-commands/codec";
import {
  CLOCK_TICK_ADDRESS,
  clockSubscribe,
  isMessage,
  SCOPE_CHUNK_ADDRESS,
  scopeSubscribe,
  scopeUnsubscribe,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import { CLOCK_PING_INTERVAL_MS } from "@/constants/osc";
import type { TransportEvent } from "@/types/osc";
import { TRANSPORT_STATUS, type TransportStatus, type WorkerTransport } from "../transport";
import { OscEndpoint, type EndpointPort } from "../endpoint";

interface FakeTransport extends WorkerTransport {
  sent: OscMessage[];
  openedUrls: string[];
  closes: number;
  state: TransportStatus;
  emit: (event: Parameters<Parameters<WorkerTransport["onEvent"]>[0]>[0]) => void;
}

function fakeTransport(): FakeTransport {
  let notify: (e: never) => void = () => {};
  const t: FakeTransport = {
    sent: [],
    openedUrls: [],
    closes: 0,
    state: TRANSPORT_STATUS.IS_NOT_INITIALIZED,
    open(url) {
      t.openedUrls.push(url);
      t.state = TRANSPORT_STATUS.IS_CONNECTING;
    },
    close() {
      t.closes += 1;
      t.state = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
    },
    send(data) {
      const packet = decode(data);
      if (isMessage(packet)) t.sent.push(packet);
    },
    onEvent(cb) {
      notify = cb;
    },
    status: () => t.state,
    emit: (event) => {
      if (event.type === "open") t.state = TRANSPORT_STATUS.IS_OPEN;
      if (event.type === "close") t.state = TRANSPORT_STATUS.IS_CLOSED;
      notify(event as never);
    },
  };
  return t;
}

function makeEndpoint() {
  const transport = fakeTransport();
  const endpoint = new OscEndpoint({ createTransport: () => transport });
  return { endpoint, transport };
}

function makePort(endpoint: OscEndpoint) {
  const events: TransportEvent[] = [];
  const port = endpoint.attach((event) => events.push(event));
  return { port, events };
}

const oscEvents = (events: TransportEvent[]) =>
  events.filter((e) => e.type === "osc").map((e) => (e as { packet: OscPacket }).packet);

/** Lifecycle events only — the clock broadcasts /clock/status osc frames on
 *  open/close, which these suites ignore. */
const lifecycle = (events: TransportEvent[]) => events.filter((e) => e.type !== "osc");

const chunks = (events: TransportEvent[]) =>
  oscEvents(events).filter(
    (p): p is OscMessage => isMessage(p) && p.address === SCOPE_CHUNK_ADDRESS,
  );

const open = (endpoint: OscEndpoint, port: EndpointPort, url = "ws://x") =>
  endpoint.handle(port, { type: "open", url });

const chunkFrame = (wireId: number): ArrayBuffer =>
  encode({
    address: SCOPE_CHUNK_ADDRESS,
    args: [wireId, 1, 0, 1, new Uint8Array([0, 0, 0, 0])],
  }).buffer;

describe("OscEndpoint membership", () => {
  it("opens the socket once; a late joiner gets the open replayed to it alone", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    open(endpoint, a.port);
    expect(transport.openedUrls).toEqual(["ws://x"]);

    transport.emit({ type: "open" });
    expect(lifecycle(a.events)).toEqual([{ type: "open" }]);

    const b = makePort(endpoint);
    open(endpoint, b.port);
    expect(transport.openedUrls).toEqual(["ws://x"]); // no reopen
    expect(lifecycle(b.events)).toEqual([{ type: "open" }]); // replayed
    expect(lifecycle(a.events)).toEqual([{ type: "open" }]); // not duplicated to A
  });

  it("a port joining mid-connecting is covered by the open broadcast", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const b = makePort(endpoint);
    open(endpoint, a.port);
    open(endpoint, b.port);
    expect(b.events).toEqual([]); // nothing synthesized while connecting

    transport.emit({ type: "open" });
    expect(lifecycle(a.events)).toEqual([{ type: "open" }]);
    expect(lifecycle(b.events)).toEqual([{ type: "open" }]);
  });

  it("closes the socket only when the LAST joined port leaves", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const b = makePort(endpoint);
    open(endpoint, a.port);
    open(endpoint, b.port);
    transport.emit({ type: "open" });

    endpoint.handle(a.port, { type: "close" });
    expect(transport.closes).toBe(0);
    endpoint.handle(b.port, { type: "close" });
    expect(transport.closes).toBe(1);
  });

  it("broadcasts a socket death to the joined ports only", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const idle = makePort(endpoint); // attached, never opened
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    transport.emit({ type: "close", code: 1006 });

    expect(a.events.filter((e) => e.type === "close")).toEqual([{ type: "close", code: 1006 }]);
    expect(idle.events).toEqual([]);
  });
});

describe("OscEndpoint scope NAT", () => {
  it("rewrites colliding local subIds to unique wire ids and routes chunks back", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const b = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    open(endpoint, b.port);

    endpoint.handle(a.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 1, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    endpoint.handle(b.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 1, scope: 9, channels: 1, chunkSize: 1024 }),
    });
    const subs = transport.sent.filter((m) => m.address === "/scope/subscribe");
    expect(subs.map((m) => m.args[0])).toEqual([1, 2]); // unique on the wire

    transport.emit({ type: "message", data: chunkFrame(2) });
    expect(chunks(a.events)).toEqual([]);
    const received = chunks(b.events);
    expect(received).toHaveLength(1);
    expect(received[0].args[0]).toBe(1); // rewritten back to B's local id
  });

  it("translates unsubscribes and stops a leaver's streams on the wire", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    endpoint.handle(a.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 1, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    endpoint.handle(a.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 2, scope: 9, channels: 1, chunkSize: 1024 }),
    });

    endpoint.handle(a.port, { type: "osc", packet: scopeUnsubscribe(1) });
    const unsubs = () => transport.sent.filter((m) => m.address === "/scope/unsubscribe");
    expect(unsubs().map((m) => m.args[0])).toEqual([1]); // local 1 = wire 1 here

    endpoint.handle(a.port, { type: "close" }); // leave stops the remaining stream
    expect(unsubs().map((m) => m.args[0])).toEqual([1, 2]);
    transport.emit({ type: "message", data: chunkFrame(2) });
    expect(chunks(a.events)).toEqual([]); // no stale route
  });

  it("drops the NAT with the socket so re-minted local ids route fresh", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    endpoint.handle(a.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 1, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    transport.emit({ type: "close", code: 1006 });

    open(endpoint, a.port); // reconnect — the client re-mints subIds from 1
    transport.emit({ type: "open" });
    endpoint.handle(a.port, {
      type: "osc",
      packet: scopeSubscribe({ subId: 1, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    const subs = transport.sent.filter((m) => m.address === "/scope/subscribe");
    const freshWireId = subs[subs.length - 1].args[0] as number;
    expect(freshWireId).not.toBe(1); // wire ids are never reused

    transport.emit({ type: "message", data: chunkFrame(freshWireId) });
    expect(chunks(a.events)).toHaveLength(1);
    expect(chunks(a.events)[0].args[0]).toBe(1);
  });
});

describe("OscEndpoint clock streams", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance", "Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ticksFor = (events: TransportEvent[]) =>
    oscEvents(events).filter(
      (p) => isMessage(p) && p.address === CLOCK_TICK_ADDRESS,
    ) as OscMessage[];

  it("keeps colliding local clock ids as separate per-port streams", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const b = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    open(endpoint, b.port);

    endpoint.handle(a.port, { type: "osc", packet: clockSubscribe(1, 100) });
    endpoint.handle(b.port, { type: "osc", packet: clockSubscribe(1, 100) });
    vi.advanceTimersByTime(100);

    expect(ticksFor(a.events)).toHaveLength(1);
    expect(ticksFor(b.events)).toHaveLength(1);
    expect(ticksFor(a.events)[0].args[0]).toBe(1); // rewritten back to the local id
    expect(ticksFor(b.events)[0].args[0]).toBe(1);
  });

  it("clock streams survive a leave; destroy() stops them for good", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    const b = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });
    open(endpoint, b.port);
    endpoint.handle(a.port, { type: "osc", packet: clockSubscribe(1, 100) });

    endpoint.handle(a.port, { type: "close" }); // leave — subscriptions outlive sessions
    vi.advanceTimersByTime(100);
    expect(ticksFor(a.events)).toHaveLength(1);

    endpoint.destroy(a.port);
    endpoint.destroy(a.port); // idempotent
    vi.advanceTimersByTime(500);
    expect(ticksFor(a.events)).toHaveLength(1); // no ticks after removal
  });

  it("a dying LAST port closes the socket through destroy()", () => {
    const { endpoint, transport } = makeEndpoint();
    const a = makePort(endpoint);
    open(endpoint, a.port);
    transport.emit({ type: "open" });

    endpoint.destroy(a.port);
    expect(transport.closes).toBe(1);
    // The estimator's ping loop stopped with the socket.
    const pings = transport.sent.filter((m) => m.address === "/clock/ping").length;
    vi.advanceTimersByTime(CLOCK_PING_INTERVAL_MS * 3);
    expect(transport.sent.filter((m) => m.address === "/clock/ping")).toHaveLength(pings);
  });
});
