// The SessionHub gate (the shared worker's whole session logic, driven
// directly — no worker, no socket): membership + grace close, chunked
// node-id handout, the worker-side scope-slot allocator, targeted
// scope-chunk routing, exclusive box claims, the presets cache/forwarding,
// and death cleanup (lock release → streams stopped, slots freed, leftover
// groups freed).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decode, encode } from "@sc-app/server-commands/codec";
import {
  gNewOne,
  isMessage,
  SCOPE_CHUNK_ADDRESS,
  scopeSubscribe,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import { LEAVE_GRACE_MS, NODE_ID_CHUNK } from "@/constants/osc";
import type { OscSession, RpcResult, TransportEvent } from "@/types/osc";
import { TRANSPORT_STATUS, type WorkerTransport } from "../transport";
import { SessionHub } from "../sessions";

const SESSION: OscSession = {
  sessionGroupId: 100,
  nodeIdBase: 1000,
  nodeIdCount: 1200,
  scopeIndexBase: 8,
  scopeIndexCount: 2,
};

interface FakeTransport extends WorkerTransport {
  sent: OscMessage[];
  openedUrls: string[];
  closed: boolean;
  emit: (event: Parameters<Parameters<WorkerTransport["onEvent"]>[0]>[0]) => void;
}

function fakeTransport(): FakeTransport {
  let notify: (e: never) => void = () => {};
  const t: FakeTransport = {
    sent: [],
    openedUrls: [],
    closed: false,
    open(url) {
      t.openedUrls.push(url);
    },
    close() {
      t.closed = true;
    },
    send(data) {
      const packet = decode(data);
      if (isMessage(packet)) t.sent.push(packet);
    },
    onEvent(cb) {
      notify = cb;
    },
    status: () => TRANSPORT_STATUS.IS_OPEN,
    emit: (event) => notify(event as never),
  };
  return t;
}

/** A hub over one injectable transport + manual lock releases. */
function makeHub() {
  const transports: FakeTransport[] = [];
  const lockReleases = new Map<string, () => void>();
  const hub = new SessionHub({
    createTransport: () => {
      const t = fakeTransport();
      transports.push(t);
      return t;
    },
    waitForLock: (name) =>
      new Promise<void>((resolve) => {
        lockReleases.set(name, resolve);
      }),
  });
  return { hub, transports, lockReleases };
}

function makeClient(hub: SessionHub) {
  const events: TransportEvent[] = [];
  const client = hub.attach((event) => events.push(event));
  return { client, events };
}

const joined = (events: TransportEvent[]) =>
  events.find((e) => e.type === "joined") as Extract<TransportEvent, { type: "joined" }>;

const rpcResult = (events: TransportEvent[], id: number): RpcResult =>
  (events.find((e) => e.type === "rpc-reply" && e.id === id) as { result: RpcResult }).result;

const oscEvents = (events: TransportEvent[]) =>
  events.filter((e) => e.type === "osc").map((e) => (e as { packet: OscPacket }).packet);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SessionHub membership", () => {
  it("first joiner opens the socket and /g_new fires once; later joiners attach", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });

    expect(transports).toHaveLength(1);
    expect(transports[0].openedUrls).toEqual(["ws://x"]);
    expect(joined(a.events)).toMatchObject({
      connected: false,
      nodes: { start: 1000, end: 1000 + NODE_ID_CHUNK },
    });

    transports[0].emit({ type: "open" });
    expect(transports[0].sent.filter((m) => m.address === "/g_new")).toHaveLength(1);
    expect(transports[0].sent[0].args).toEqual([100, 1, 0]);
    expect(a.events.some((e) => e.type === "open")).toBe(true);

    const b = makeClient(hub);
    hub.handle(b.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    expect(transports).toHaveLength(1); // no second socket
    expect(joined(b.events)).toMatchObject({
      connected: true,
      nodes: { start: 1000 + NODE_ID_CHUNK, end: 1000 + 2 * NODE_ID_CHUNK },
    });
    expect(b.events.some((e) => e.type === "open")).toBe(true); // replayed
    expect(transports[0].sent.filter((m) => m.address === "/g_new")).toHaveLength(1);
  });

  it("closes the socket LEAVE_GRACE_MS after the last leave; a rejoin cancels it", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });

    hub.handle(a.client, { type: "leave" });
    vi.advanceTimersByTime(LEAVE_GRACE_MS - 1);
    expect(transports[0].closed).toBe(false);

    // Rejoin within grace keeps the live connection.
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    vi.advanceTimersByTime(LEAVE_GRACE_MS * 2);
    expect(transports[0].closed).toBe(false);
    expect(transports).toHaveLength(1);

    hub.handle(a.client, { type: "leave" });
    vi.advanceTimersByTime(LEAVE_GRACE_MS);
    expect(transports[0].closed).toBe(true);
  });

  it("a socket close broadcasts once and forgets the connection", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });
    transports[0].emit({ type: "close", code: 1006 });

    expect(a.events.filter((e) => e.type === "close")).toHaveLength(1);
    // A rejoin opens a FRESH transport.
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    expect(transports).toHaveLength(2);
  });
});

describe("SessionHub allocators", () => {
  it("hands out disjoint node chunks and errors on exhaustion", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });

    hub.handle(a.client, { type: "rpc", id: 1, req: { op: "alloc-nodes" } });
    expect(rpcResult(a.events, 1)).toEqual({
      ok: true,
      value: { start: 1512, end: 2024 },
    });
    hub.handle(a.client, { type: "rpc", id: 2, req: { op: "alloc-nodes" } });
    expect(rpcResult(a.events, 2)).toEqual({ ok: true, value: { start: 2024, end: 2200 } });
    hub.handle(a.client, { type: "rpc", id: 3, req: { op: "alloc-nodes" } });
    expect(rpcResult(a.events, 3)).toEqual({ ok: false, error: "node-id block exhausted" });
  });

  it("allocates scope slots exactly, recycles frees, and errors past the span", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });

    hub.handle(a.client, { type: "rpc", id: 1, req: { op: "alloc-scope" } });
    hub.handle(a.client, { type: "rpc", id: 2, req: { op: "alloc-scope" } });
    expect(rpcResult(a.events, 1)).toEqual({ ok: true, value: 8 });
    expect(rpcResult(a.events, 2)).toEqual({ ok: true, value: 9 });
    hub.handle(a.client, { type: "rpc", id: 3, req: { op: "alloc-scope" } });
    expect(rpcResult(a.events, 3).ok).toBe(false);
    hub.handle(a.client, { type: "rpc", id: 4, req: { op: "free-scope", index: 8 } });
    hub.handle(a.client, { type: "rpc", id: 5, req: { op: "alloc-scope" } });
    expect(rpcResult(a.events, 5)).toEqual({ ok: true, value: 8 });
  });
});

describe("SessionHub routing", () => {
  it("routes /scope/chunk only to the subscribing client", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    const b = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });
    hub.handle(b.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });

    hub.handle(a.client, {
      type: "osc",
      packet: scopeSubscribe({ subId: 7, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    const before = { a: oscEvents(a.events).length, b: oscEvents(b.events).length };
    const chunk: OscMessage = {
      address: SCOPE_CHUNK_ADDRESS,
      args: [7, 1, 0, 1, new Uint8Array([0, 0, 0, 0])],
    };
    transports[0].emit({ type: "message", data: encode(chunk).buffer });

    expect(oscEvents(a.events)).toHaveLength(before.a + 1);
    expect(oscEvents(b.events)).toHaveLength(before.b);
  });
});

describe("SessionHub boxes + presets", () => {
  const ENTRY = { plugin: "p1", values: { abc: { path: "gain", value: 0.5 } } };

  it("claims are exclusive, released on release/leave, and re-grantable to the owner", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    const b = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });
    hub.handle(b.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });

    hub.handle(a.client, { type: "rpc", id: 1, req: { op: "box-claim", boxId: "box-1" } });
    expect(rpcResult(a.events, 1)).toEqual({ ok: true, value: { granted: true } });
    hub.handle(a.client, { type: "rpc", id: 2, req: { op: "box-claim", boxId: "box-1" } });
    expect(rpcResult(a.events, 2)).toEqual({ ok: true, value: { granted: true } }); // re-grant to owner
    hub.handle(b.client, { type: "rpc", id: 1, req: { op: "box-claim", boxId: "box-1" } });
    expect(rpcResult(b.events, 1)).toEqual({ ok: true, value: { granted: false } });

    hub.handle(a.client, { type: "rpc", id: 3, req: { op: "box-release", boxId: "box-1" } });
    hub.handle(b.client, { type: "rpc", id: 2, req: { op: "box-claim", boxId: "box-1" } });
    expect(rpcResult(b.events, 2)).toEqual({ ok: true, value: { granted: true } });
  });

  it("caches presets and forwards puts to the OTHER clients only", () => {
    const { hub, transports } = makeHub();
    const a = makeClient(hub);
    const b = makeClient(hub);
    hub.handle(a.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });
    transports[0].emit({ type: "open" });
    hub.handle(b.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });

    hub.handle(a.client, {
      type: "rpc",
      id: 1,
      req: { op: "presets-put", boxId: "box-1", entry: ENTRY },
    });
    expect(b.events.filter((e) => e.type === "presets")).toEqual([
      { type: "presets", boxId: "box-1", entry: ENTRY },
    ]);
    expect(a.events.filter((e) => e.type === "presets")).toEqual([]);

    hub.handle(b.client, { type: "rpc", id: 2, req: { op: "presets-get", boxId: "box-1" } });
    expect(rpcResult(b.events, 2)).toEqual({ ok: true, value: ENTRY });
  });

  it("death (lock release) frees the client's groups, streams, slots, and claims", async () => {
    const { hub, transports, lockReleases } = makeHub();
    const a = makeClient(hub);
    hub.handle(a.client, {
      type: "join",
      url: "ws://x",
      sessionId: "s1",
      session: SESSION,
      lockName: "lock-a",
    });
    transports[0].emit({ type: "open" });
    const b = makeClient(hub);
    hub.handle(b.client, { type: "join", url: "ws://x", sessionId: "s1", session: SESSION });

    hub.handle(a.client, { type: "osc", packet: gNewOne(2001, 1, 100) }); // a plugin group
    hub.handle(a.client, {
      type: "osc",
      packet: scopeSubscribe({ subId: 7, scope: 8, channels: 1, chunkSize: 1024 }),
    });
    hub.handle(a.client, { type: "rpc", id: 1, req: { op: "alloc-scope" } });
    hub.handle(a.client, { type: "rpc", id: 2, req: { op: "box-claim", boxId: "box-1" } });

    lockReleases.get("lock-a")!();
    await vi.waitFor(() => {
      expect(transports[0].sent.some((m) => m.address === "/g_freeAll" && m.args[0] === 2001)).toBe(
        true,
      );
    });
    expect(transports[0].sent.some((m) => m.address === "/n_free" && m.args[0] === 2001)).toBe(
      true,
    );
    expect(
      transports[0].sent.some((m) => m.address === "/scope/unsubscribe" && m.args[0] === 7),
    ).toBe(true);

    // The dead client's slot and claim are reusable by the survivor.
    hub.handle(b.client, { type: "rpc", id: 1, req: { op: "alloc-scope" } });
    expect(rpcResult(b.events, 1)).toEqual({ ok: true, value: 8 });
    hub.handle(b.client, { type: "rpc", id: 2, req: { op: "box-claim", boxId: "box-1" } });
    expect(rpcResult(b.events, 2)).toEqual({ ok: true, value: { granted: true } });
  });
});
