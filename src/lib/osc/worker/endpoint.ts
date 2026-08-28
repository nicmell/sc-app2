// The shared OSC ENDPOINT: one WebSocket transport + one bridge clock, N
// attached ports — each speaking the UNCHANGED single-client protocol
// (open/osc/close down, open/osc/error/close up), so WorkerClient, OscClient,
// and the middlewares never learn the socket is shared. The endpoint
// reinterprets the commands per port:
//
//   - `open` is an idempotent JOIN: the first opener (or a NEW url) opens
//     the socket exactly as before; a port joining a standing connection
//     gets the `open` it missed replayed to it alone.
//   - `close` is a LEAVE: the socket closes only when the LAST joined port
//     leaves — safe because each WorkerClient already synthesizes its own
//     close locally and never waits for a worker echo.
//   - the scope subId space is NAT-translated: /scope/* is REAL wire
//     traffic (the Rust bridge's pinned contract), so ports minting subIds
//     from 1 would collide — outbound /scope/subscribe ids are rewritten to
//     endpoint-unique wire ids, and /scope/chunk is rewritten back and
//     routed ONLY to its owner (which also keeps the zero-copy buffer
//     transfer single-consumer). Scope NAT dies with the socket (each
//     client re-mints subIds from 1 on its next connect).
//   - the CLOCK is a typed worker service, not OSC: `clock-subscribe`/
//     `clock-unsubscribe` commands and `clock-tick` events carry port-local
//     ids and each port's streams are keyed separately, so there is nothing
//     to NAT; `clock-status` broadcasts the estimator. Only ping/pong touch
//     the wire (handled internally beside the socket). Clock streams
//     survive a socket close — subscriptions outlive sessions.
//
// Everything else — inbound OSC, open/error/close lifecycle — broadcasts to
// the joined ports (structured clone; only the targeted scope chunks carry
// transferables). Single-socket by design: an `open` for a
// DIFFERENT url keeps today's dispose-and-reopen semantics (concurrent
// different-session clients are a later step). ALSO deferred to the
// allocation step: two clients on ONE session are not yet safe — node ids
// and scope slots are still per-realm counters over the same block, and a
// late joiner's client re-sends the session-group /g_new (a duplicate-node
// /fail). This endpoint only makes such clients TRANSPORT-correct. Pure
// logic over an injected transport — worker.ts is the thin dispatcher; the
// unit suite drives this class directly.

import { decode, encode } from "@sc-app/server-commands/codec";
import {
  CLOCK_PONG_ADDRESS,
  isMessage,
  SCOPE_CHUNK_ADDRESS,
  SCOPE_SUBSCRIBE_ADDRESS,
  SCOPE_UNSUBSCRIBE_ADDRESS,
  scopeUnsubscribe,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { createWsTransport, TRANSPORT_STATUS, type WorkerTransport } from "./transport";
import { WorkerClock } from "./clock";

/** One port's outbound seam — worker.ts wraps the real MessagePort (or the
 *  dedicated fallback's own postMessage). */
export type PostEvent = (event: TransportEvent, transfer?: Transferable[]) => void;

/** Per-port endpoint state. Opaque to callers — worker.ts only threads it
 *  between attach() and handle(). */
export interface EndpointPort {
  post: PostEvent;
  /** Joined the session (open sent, close not yet) — the socket refcount. */
  opened: boolean;
  /** A liveness waiter is armed (one per port — see the `attach` command). */
  watched: boolean;
  /** port-local clock id → the stream's stop (survives socket closes). */
  clockSubs: Map<number, () => void>;
  /** local scope subId → wire subId (dies with the socket). */
  scopeNat: Map<number, number>;
}

export interface EndpointOptions {
  /** Injectable transport factory (tests). */
  createTransport?: () => WorkerTransport;
  /** Injectable liveness waiter: resolves when the named lock becomes
   *  acquirable — i.e. the client holding it died. Defaults to Web Locks. */
  waitForLock?: (name: string) => Promise<void>;
}

const defaultWaitForLock = (name: string): Promise<void> => {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks ? locks.request(name, () => undefined) : new Promise(() => {});
};

export class OscEndpoint {
  private readonly transport: WorkerTransport;
  private readonly waitForLock: (name: string) => Promise<void>;
  private readonly clock: WorkerClock;
  private readonly ports = new Set<EndpointPort>();
  /** The url of the current (connecting or open) socket. */
  private url: string | null = null;
  private nextWireSubId = 1;
  /** wire subId → owning port + its local subId (inbound chunk routing). */
  private readonly scopeRoutes = new Map<number, { port: EndpointPort; localId: number }>();

  constructor(options: EndpointOptions = {}) {
    this.transport = (options.createTransport ?? createWsTransport)();
    this.waitForLock = options.waitForLock ?? defaultWaitForLock;
    this.clock = new WorkerClock({
      onStatus: (offset, rtt) => this.broadcast({ type: "clock-status", offset, rtt }),
      sendPing: (message) => this.transport.send(encode(message)),
    });
    this.transport.onEvent((event) => {
      if (event.type === "message") {
        this.inbound(event.data);
      } else if (event.type === "open") {
        this.clock.onOpen();
        this.broadcast(event);
      } else if (event.type === "error") {
        this.broadcast(event);
      } else {
        // The socket died under us (server close, network) — an orderly
        // endpoint close never emits (dispose only), matching the
        // single-client contract where the client synthesizes its close.
        this.clock.onClose();
        this.url = null;
        this.dropScopeNat();
        this.broadcast(event);
        // Every client's status mirror flips to CLOSED on this event and its
        // close() early-returns from there — clear the memberships to match,
        // or ghost `opened` flags would inflate the refcount forever (a
        // rejoiner's open would also leak into dead members' mirrors).
        for (const member of this.ports) member.opened = false;
      }
    });
  }

  /** Register a port; feed its messages through handle(). */
  attach(post: PostEvent): EndpointPort {
    const port: EndpointPort = {
      post,
      opened: false,
      watched: false,
      clockSubs: new Map(),
      scopeNat: new Map(),
    };
    this.ports.add(port);
    return port;
  }

  handle(port: EndpointPort, command: TransportCommand): void {
    switch (command.type) {
      case "attach":
        this.watch(port, command.lockName);
        return;
      case "open":
        this.open(port, command.url);
        return;
      case "close":
        this.leave(port);
        return;
      case "osc":
        this.outbound(port, command.packet);
        return;
      case "clock-subscribe":
        // Replace-on-resubscribe, exactly the old semantics; ids are
        // port-local so no cross-port bookkeeping exists at all.
        port.clockSubs.get(command.id)?.();
        port.clockSubs.set(
          command.id,
          this.clock.subscribe(command.intervalMs, (n) =>
            port.post({ type: "clock-tick", id: command.id, n }),
          ),
        );
        return;
      case "clock-unsubscribe":
        port.clockSubs.get(command.id)?.();
        port.clockSubs.delete(command.id);
        return;
    }
  }

  // ── membership ──────────────────────────────────────────────────────────

  /** Arm the liveness waiter: the client HOLDS `lockName` until its document
   *  dies, so being granted the lock means the port's context is gone —
   *  destroy() it (idempotent; an orderly close beforehand is fine). One
   *  waiter per port; duplicates are ignored. */
  private watch(port: EndpointPort, lockName: string): void {
    if (port.watched) return;
    port.watched = true;
    void this.waitForLock(lockName).then(() => this.destroy(port));
  }

  private open(port: EndpointPort, url: string): void {
    port.opened = true;
    const status = this.transport.status();
    const active = status === TRANSPORT_STATUS.IS_CONNECTING || status === TRANSPORT_STATUS.IS_OPEN;
    if (!active || this.url !== url) {
      // First opener, a reconnect, or a NEW url (dispose-and-reopen, as the
      // single-client worker always did).
      this.url = url;
      this.dropScopeNat();
      this.transport.open(url);
      return;
    }
    // Joining a standing connection: replay the `open` this port missed so
    // its status mirror and connect() promise see the usual seam. A port
    // joining mid-CONNECTING needs nothing — the open broadcast covers it.
    if (status === TRANSPORT_STATUS.IS_OPEN) port.post({ type: "open" });
  }

  /** The `close` command: leave the session. Scope streams stop (their wire
   *  ids die with the membership); CLOCK streams deliberately survive —
   *  subscriptions outlive socket sessions, exactly as before. The socket
   *  closes (silently — every client synthesizes its own close) when the
   *  last joined port leaves. */
  private leave(port: EndpointPort): void {
    if (!port.opened) return;
    const last = ![...this.ports].some((p) => p !== port && p.opened);
    // The clock reset (offset/rtt → 0) must still reach the LEAVER — its
    // store view and clockNow() would otherwise keep the stale offset — so
    // it runs before the membership flag flips.
    if (last) this.clock.onClose();
    port.opened = false;
    const open = this.transport.status() === TRANSPORT_STATUS.IS_OPEN;
    for (const wireId of port.scopeNat.values()) {
      this.scopeRoutes.delete(wireId);
      if (open) this.transport.send(encode(scopeUnsubscribe(wireId)));
    }
    port.scopeNat.clear();
    if (last) {
      this.url = null;
      this.transport.close();
    }
  }

  /** Full removal (the port's context is gone — see the attach/liveness
   *  seam): leave + stop its clock streams + forget it. Idempotent. */
  destroy(port: EndpointPort): void {
    if (!this.ports.has(port)) return;
    this.leave(port);
    for (const stop of port.clockSubs.values()) stop();
    port.clockSubs.clear();
    this.ports.delete(port);
  }

  // ── traffic ─────────────────────────────────────────────────────────────

  private outbound(port: EndpointPort, packet: OscPacket): void {
    try {
      const outbound = this.natOutbound(port, packet);
      if (outbound !== null) this.transport.send(encode(outbound));
    } catch (error) {
      port.post({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  /** Rewrite a port-local scope subId to an endpoint-unique wire id (our
   *  scope commands are always bare messages — bundles pass through); null
   *  drops the packet. */
  private natOutbound(port: EndpointPort, packet: OscPacket): OscPacket | null {
    if (!isMessage(packet)) return packet;
    if (packet.address === SCOPE_SUBSCRIBE_ADDRESS) {
      const localId = Number(packet.args[0]);
      const wireId = this.nextWireSubId++;
      port.scopeNat.set(localId, wireId);
      this.scopeRoutes.set(wireId, { port, localId });
      return { address: packet.address, args: [wireId, ...packet.args.slice(1)] };
    }
    if (packet.address === SCOPE_UNSUBSCRIBE_ADDRESS) {
      const localId = Number(packet.args[0]);
      const wireId = port.scopeNat.get(localId);
      // An unmapped unsubscribe is DROPPED, not passed through: the raw
      // local id could collide with another port's live wire id.
      if (wireId === undefined) return null;
      port.scopeNat.delete(localId);
      this.scopeRoutes.delete(wireId);
      return { address: packet.address, args: [wireId, ...packet.args.slice(1)] };
    }
    return packet;
  }

  private inbound(data: ArrayBuffer): void {
    let packet: OscPacket;
    try {
      packet = decode(new Uint8Array(data));
    } catch (error) {
      this.broadcast({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    if (isMessage(packet)) {
      if (packet.address === CLOCK_PONG_ADDRESS) {
        this.clock.onPong(packet, Date.now());
        return;
      }
      if (packet.address === SCOPE_CHUNK_ADDRESS) {
        // Targeted: the chunk's buffer is TRANSFERRED (single consumer), and
        // the wire subId is rewritten back to the owner's local id. A chunk
        // racing its unsubscribe just drops.
        const route = this.scopeRoutes.get(Number(packet.args[0]));
        if (!route) return;
        const rewritten: OscMessage = {
          address: packet.address,
          args: [route.localId, ...packet.args.slice(1)],
        };
        const transfer: ArrayBuffer[] = [];
        for (const arg of rewritten.args) {
          if (arg instanceof Uint8Array) transfer.push(arg.buffer);
        }
        route.port.post({ type: "osc", packet: rewritten }, transfer);
        return;
      }
    }
    // Fan-out is structured-clone only — a buffer can move to ONE port, and
    // the high-rate blobs (scope chunks) never reach this path.
    this.broadcast({ type: "osc", packet });
  }

  /** To the JOINED ports only — a port that never opened (or left) is not a
   *  session participant. */
  private broadcast(event: TransportEvent): void {
    for (const port of this.ports) {
      if (port.opened) port.post(event);
    }
  }

  private dropScopeNat(): void {
    this.scopeRoutes.clear();
    for (const port of this.ports) port.scopeNat.clear();
  }
}
