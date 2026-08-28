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
//   - id spaces are NAT-translated so ports can't collide: every port mints
//     scope subIds and clock ids from 1, so outbound /scope/subscribe ids
//     are rewritten to endpoint-unique wire ids (and /scope/chunk rewritten
//     back and routed ONLY to its owner — which also keeps the zero-copy
//     buffer transfer single-consumer), while clock streams are keyed by an
//     endpoint-unique id and ticks rewritten back for their subscriber.
//     Clock NAT entries survive a socket close (subscriptions outlive
//     sessions, exactly as before); scope NAT dies with the socket (each
//     client re-mints subIds from 1 on its next connect).
//
// Everything else — inbound OSC, open/error/close lifecycle, /clock/status —
// broadcasts to the joined ports (structured clone; only the targeted scope
// chunks carry transferables). Single-socket by design: an `open` for a
// DIFFERENT url keeps today's dispose-and-reopen semantics (concurrent
// different-session clients are a later step). Pure logic over an injected
// transport — worker.ts is the thin dispatcher; the unit suite drives this
// class directly.

import { decode, encode } from "@sc-app/server-commands/codec";
import {
  CLOCK_PONG_ADDRESS,
  CLOCK_SUBSCRIBE_ADDRESS,
  CLOCK_TICK_ADDRESS,
  CLOCK_UNSUBSCRIBE_ADDRESS,
  clockSubscribe,
  clockTick,
  clockUnsubscribe,
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
  /** local clock id → endpoint-unique clock key (survives socket closes). */
  clockNat: Map<number, number>;
  /** local scope subId → wire subId (dies with the socket). */
  scopeNat: Map<number, number>;
}

export interface EndpointOptions {
  /** Injectable transport factory (tests). */
  createTransport?: () => WorkerTransport;
}

export class OscEndpoint {
  private readonly transport: WorkerTransport;
  private readonly clock: WorkerClock;
  private readonly ports = new Set<EndpointPort>();
  /** The url of the current (connecting or open) socket. */
  private url: string | null = null;
  private nextWireSubId = 1;
  private nextClockKey = 1;
  /** wire subId → owning port + its local subId (inbound chunk routing). */
  private readonly scopeRoutes = new Map<number, { port: EndpointPort; localId: number }>();
  /** clock key → owning port + its local id (tick routing). */
  private readonly clockRoutes = new Map<number, { port: EndpointPort; localId: number }>();

  constructor(options: EndpointOptions = {}) {
    this.transport = (options.createTransport ?? createWsTransport)();
    this.clock = new WorkerClock({
      post: (message) => this.postClock(message),
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
      }
    });
  }

  /** Register a port; feed its messages through handle(). */
  attach(post: PostEvent): EndpointPort {
    const port: EndpointPort = { post, opened: false, clockNat: new Map(), scopeNat: new Map() };
    this.ports.add(port);
    return port;
  }

  handle(port: EndpointPort, command: TransportCommand): void {
    switch (command.type) {
      case "open":
        this.open(port, command.url);
        return;
      case "close":
        this.leave(port);
        return;
      case "osc":
        this.outbound(port, command.packet);
        return;
    }
  }

  // ── membership ──────────────────────────────────────────────────────────

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
    port.opened = false;
    const open = this.transport.status() === TRANSPORT_STATUS.IS_OPEN;
    for (const wireId of port.scopeNat.values()) {
      this.scopeRoutes.delete(wireId);
      if (open) this.transport.send(encode(scopeUnsubscribe(wireId)));
    }
    port.scopeNat.clear();
    if (![...this.ports].some((p) => p.opened)) {
      this.url = null;
      this.clock.onClose();
      this.transport.close();
    }
  }

  /** Full removal (the port's context is gone — see the attach/liveness
   *  seam): leave + stop its clock streams + forget it. Idempotent. */
  destroy(port: EndpointPort): void {
    if (!this.ports.has(port)) return;
    this.leave(port);
    for (const key of port.clockNat.values()) {
      this.clockRoutes.delete(key);
      this.clock.handleCommand(clockUnsubscribe(key));
    }
    port.clockNat.clear();
    this.ports.delete(port);
  }

  // ── traffic ─────────────────────────────────────────────────────────────

  private outbound(port: EndpointPort, packet: OscPacket): void {
    try {
      // Only our code creates clock commands, always as bare messages;
      // bundles deliberately remain ordinary transport traffic.
      if (isMessage(packet) && packet.address.startsWith("/clock/")) {
        this.clockCommand(port, packet);
        return;
      }
      this.transport.send(encode(this.natOutbound(port, packet)));
    } catch (error) {
      port.post({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  private clockCommand(port: EndpointPort, message: OscMessage): void {
    if (message.address === CLOCK_SUBSCRIBE_ADDRESS) {
      const localId = Number(message.args[0]);
      // NAT into the endpoint-unique key space (ports all mint ids from
      // their own counters); re-subscribing an existing local id reuses its
      // key, so the clock's replace-on-subscribe behavior is preserved.
      let key = port.clockNat.get(localId);
      if (key === undefined) {
        key = this.nextClockKey++;
        port.clockNat.set(localId, key);
        this.clockRoutes.set(key, { port, localId });
      }
      this.clock.handleCommand(clockSubscribe(key, Number(message.args[1])));
    } else if (message.address === CLOCK_UNSUBSCRIBE_ADDRESS) {
      const localId = Number(message.args[0]);
      const key = port.clockNat.get(localId);
      if (key === undefined) return;
      port.clockNat.delete(localId);
      this.clockRoutes.delete(key);
      this.clock.handleCommand(clockUnsubscribe(key));
    }
  }

  /** Rewrite a port-local scope subId to an endpoint-unique wire id (our
   *  scope commands are always bare messages — bundles pass through). */
  private natOutbound(port: EndpointPort, packet: OscPacket): OscPacket {
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
      if (wireId === undefined) return packet; // stale unsubscribe — harmless
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

  private postClock(message: OscMessage): void {
    if (message.address === CLOCK_TICK_ADDRESS) {
      const route = this.clockRoutes.get(Number(message.args[0]));
      route?.port.post({ type: "osc", packet: clockTick(route.localId, Number(message.args[1])) });
      return;
    }
    this.broadcast({ type: "osc", packet: message }); // /clock/status
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
