// The shared-session hub (docs/multi-tab.md): one Connection per session id
// owning the WebSocket, codec seam, and WorkerClock; N member clients (the
// dashboard, box iframes, popped tabs), each a message port. The hub owns
// everything that must not collide across clients — node-id chunk handout,
// the scope-slot free list, subscription-id routing (scope chunks carry
// TRANSFERRED buffers, so they go to exactly their owning port; clock ticks
// go to their subscriber; everything else broadcasts), the session group's
// one-time /g_new, box claims (exclusive, phase one), and the live presets
// cache. Client death is observed via Web Locks (the client holds a lock the
// worker waits on); the socket closes LEAVE_GRACE_MS after the last member
// leaves, so a reload rejoins the live session. Pure logic over injected
// ports/transports — worker.ts is the thin dispatcher, and the unit suite
// drives the hub directly.

import { decode, encode } from "@sc-app/server-commands/codec";
import {
  AddToTail,
  CLOCK_PONG_ADDRESS,
  CLOCK_SUBSCRIBE_ADDRESS,
  CLOCK_TICK_ADDRESS,
  CLOCK_UNSUBSCRIBE_ADDRESS,
  clockUnsubscribe,
  gFreeAll,
  gNewOne,
  isMessage,
  nFree,
  SCOPE_CHUNK_ADDRESS,
  SCOPE_SUBSCRIBE_ADDRESS,
  SCOPE_UNSUBSCRIBE_ADDRESS,
  scopeUnsubscribe,
  walkPacket,
  type OscPacket,
} from "@sc-app/server-commands";
import { LEAVE_GRACE_MS, NODE_ID_CHUNK } from "@/constants/osc";
import type { BoxPresets } from "@/types/api";
import type {
  OscSession,
  RpcRequest,
  RpcResult,
  TransportCommand,
  TransportEvent,
} from "@/types/osc";
import { createWsTransport, type WorkerTransport } from "./transport";
import { WorkerClock } from "./clock";

/** One member's outbound seam — worker.ts wraps the real MessagePort (or the
 *  dedicated worker's own postMessage). */
export type PostEvent = (event: TransportEvent, transfer?: Transferable[]) => void;

interface Client {
  id: number;
  post: PostEvent;
  conn: Connection | null;
  /** Plugin groups this client created (/g_new observed outbound, pruned on
   *  /n_free) — freed on death so an orphaned client's synths don't play
   *  forever under the shared session. */
  groups: Set<number>;
  scopeSlots: Set<number>;
  scopeSubs: Set<number>;
  clockSubs: Set<number>;
  boxes: Set<string>;
}

interface Connection {
  sessionId: string;
  session: OscSession;
  transport: WorkerTransport;
  clock: WorkerClock;
  open: boolean;
  clients: Map<number, Client>;
  /** Next node id past every handed-out chunk. */
  nodeCursor: number;
  scopeUsed: number;
  freeScopeSlots: number[];
  scopeRoutes: Map<number, Client>;
  clockRoutes: Map<number, Client>;
  presets: Map<string, BoxPresets>;
  boxOwners: Map<string, Client>;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

export interface HubOptions {
  /** Injectable transport factory (tests). */
  createTransport?: () => WorkerTransport;
  /** Injectable lock waiter: resolves when the named lock is acquirable,
   *  i.e. the holding client died. Defaults to Web Locks; absent → no
   *  death detection (the dedicated-worker fallback dies with its page). */
  waitForLock?: (name: string) => Promise<void>;
}

const defaultWaitForLock = (name: string): Promise<void> => {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  return locks ? locks.request(name, () => undefined) : new Promise(() => {});
};

export class SessionHub {
  private readonly connections = new Map<string, Connection>();
  private readonly createTransport: () => WorkerTransport;
  private readonly waitForLock: (name: string) => Promise<void>;
  private nextClientId = 1;

  constructor(options: HubOptions = {}) {
    this.createTransport = options.createTransport ?? createWsTransport;
    this.waitForLock = options.waitForLock ?? defaultWaitForLock;
  }

  /** Register a port; the returned handle feeds its messages in. */
  attach(post: PostEvent): Client {
    return {
      id: 0,
      post,
      conn: null,
      groups: new Set(),
      scopeSlots: new Set(),
      scopeSubs: new Set(),
      clockSubs: new Set(),
      boxes: new Set(),
    };
  }

  handle(client: Client, command: TransportCommand): void {
    switch (command.type) {
      case "join":
        this.join(client, command);
        return;
      case "leave":
        this.release(client);
        return;
      case "osc":
        this.outbound(client, command.packet);
        return;
      case "rpc":
        client.post({ type: "rpc-reply", id: command.id, result: this.rpc(client, command.req) });
        return;
    }
  }

  // ── membership ──────────────────────────────────────────────────────────

  private join(
    client: Client,
    command: { url: string; sessionId: string; session: OscSession; lockName?: string },
  ): void {
    if (client.conn) this.release(client); // re-join = leave + fresh membership
    const conn = this.connection(command.sessionId, command.session, command.url);
    if (conn.graceTimer !== null) {
      clearTimeout(conn.graceTimer);
      conn.graceTimer = null;
    }
    client.id = this.nextClientId++;
    client.conn = conn;
    conn.clients.set(client.id, client);
    client.post({
      type: "joined",
      clientId: client.id,
      connected: conn.open,
      nodes: this.allocNodes(conn),
    });
    // A late joiner missed the connection's own open broadcast — replay it so
    // the client's status mirror and connect() promise see the same seam.
    if (conn.open) client.post({ type: "open" });
    if (command.lockName) {
      void this.waitForLock(command.lockName).then(() => {
        // Granted = the holding client died without leaving.
        if (client.conn) this.release(client);
      });
    }
  }

  /** Orderly leave AND death cleanup: stop this client's streams, free its
   *  slots and leftover groups (an orderly disconnect already freed them —
   *  the set is pruned by outbound /n_free), release its boxes, and close
   *  the socket when the last member is gone (grace window first). */
  private release(client: Client): void {
    const conn = client.conn;
    if (!conn) return;
    client.conn = null;
    conn.clients.delete(client.id);
    for (const subId of client.scopeSubs) {
      conn.scopeRoutes.delete(subId);
      if (conn.open) conn.transport.send(encode(scopeUnsubscribe(subId)));
    }
    for (const id of client.clockSubs) {
      conn.clockRoutes.delete(id);
      conn.clock.handleCommand(clockUnsubscribe(id));
    }
    for (const index of client.scopeSlots) this.freeScope(conn, index);
    if (conn.open) {
      for (const groupId of client.groups) {
        conn.transport.send(encode(gFreeAll(groupId)));
        conn.transport.send(encode(nFree(groupId)));
      }
    }
    for (const boxId of client.boxes) {
      if (conn.boxOwners.get(boxId) === client) conn.boxOwners.delete(boxId);
    }
    client.groups.clear();
    client.scopeSlots.clear();
    client.scopeSubs.clear();
    client.clockSubs.clear();
    client.boxes.clear();
    if (conn.clients.size === 0) {
      conn.graceTimer = setTimeout(() => this.closeConnection(conn), LEAVE_GRACE_MS);
    }
  }

  private closeConnection(conn: Connection): void {
    this.connections.delete(conn.sessionId);
    conn.clock.onClose();
    conn.transport.close(); // emits nothing; the server ends the session on WS close
  }

  // ── the connection (one per session id) ─────────────────────────────────

  private connection(sessionId: string, session: OscSession, url: string): Connection {
    const existing = this.connections.get(sessionId);
    if (existing) return existing;
    const transport = this.createTransport();
    const conn: Connection = {
      sessionId,
      session,
      transport,
      open: false,
      clients: new Map(),
      nodeCursor: session.nodeIdBase,
      scopeUsed: 0,
      freeScopeSlots: [],
      scopeRoutes: new Map(),
      clockRoutes: new Map(),
      presets: new Map(),
      boxOwners: new Map(),
      graceTimer: null,
      clock: new WorkerClock({
        post: (message) => {
          if (message.address === CLOCK_TICK_ADDRESS) {
            conn.clockRoutes.get(Number(message.args[0]))?.post({ type: "osc", packet: message });
          } else {
            this.broadcast(conn, { type: "osc", packet: message });
          }
        },
        sendPing: (message) => transport.send(encode(message)),
      }),
    };
    transport.onEvent((event) => {
      if (event.type === "message") {
        this.inbound(conn, event.data);
      } else if (event.type === "open") {
        conn.open = true;
        // The session is freshly minted (it dies with this socket), so its
        // group never pre-exists: create it ONCE, at the tail of scsynth's
        // root group, before any member is told the connection is up.
        transport.send(encode(gNewOne(conn.session.sessionGroupId, AddToTail, 0)));
        conn.clock.onOpen();
        this.broadcast(conn, event);
      } else if (event.type === "error") {
        this.broadcast(conn, event);
      } else {
        // Socket gone → the session is over for every member: broadcast the
        // one close, then forget the connection (a later join reopens fresh).
        conn.open = false;
        conn.clock.onClose();
        this.broadcast(conn, event);
        this.connections.delete(conn.sessionId);
        for (const member of conn.clients.values()) member.conn = null;
        conn.clients.clear();
      }
    });
    this.connections.set(sessionId, conn);
    transport.open(url);
    return conn;
  }

  private broadcast(conn: Connection, event: TransportEvent): void {
    for (const member of conn.clients.values()) member.post(event);
  }

  // ── traffic ─────────────────────────────────────────────────────────────

  private outbound(client: Client, packet: OscPacket): void {
    const conn = client.conn;
    if (!conn) return; // not a member (raced a leave) — drop
    try {
      // Only our code creates clock commands, always as bare messages;
      // bundles deliberately remain ordinary transport traffic.
      if (isMessage(packet) && packet.address.startsWith("/clock/")) {
        if (packet.address === CLOCK_SUBSCRIBE_ADDRESS) {
          const id = Number(packet.args[0]);
          conn.clockRoutes.set(id, client);
          client.clockSubs.add(id);
        } else if (packet.address === CLOCK_UNSUBSCRIBE_ADDRESS) {
          conn.clockRoutes.delete(Number(packet.args[0]));
          client.clockSubs.delete(Number(packet.args[0]));
        }
        conn.clock.handleCommand(packet);
        return;
      }
      // Track per-client wire state the hub must clean up on death: scope
      // streams (route table) and created plugin groups.
      walkPacket(packet, (message) => {
        if (message.address === SCOPE_SUBSCRIBE_ADDRESS) {
          const subId = Number(message.args[0]);
          conn.scopeRoutes.set(subId, client);
          client.scopeSubs.add(subId);
        } else if (message.address === SCOPE_UNSUBSCRIBE_ADDRESS) {
          conn.scopeRoutes.delete(Number(message.args[0]));
          client.scopeSubs.delete(Number(message.args[0]));
        } else if (message.address === "/g_new") {
          const groupId = Number(message.args[0]);
          if (groupId !== conn.session.sessionGroupId) client.groups.add(groupId);
        } else if (message.address === "/n_free") {
          client.groups.delete(Number(message.args[0]));
        }
      });
      conn.transport.send(encode(packet));
    } catch (error) {
      client.post({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private inbound(conn: Connection, data: ArrayBuffer): void {
    let packet: OscPacket;
    try {
      packet = decode(new Uint8Array(data));
    } catch (error) {
      this.broadcast(conn, {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    if (isMessage(packet)) {
      if (packet.address === CLOCK_PONG_ADDRESS) {
        conn.clock.onPong(packet, Date.now());
        return;
      }
      if (packet.address === SCOPE_CHUNK_ADDRESS) {
        // Chunk buffers are TRANSFERRED (single consumer) — route to exactly
        // the owning member; a chunk racing its unsubscribe just drops.
        const owner = conn.scopeRoutes.get(Number(packet.args[0]));
        if (owner) {
          const transfer: ArrayBuffer[] = [];
          for (const arg of packet.args) {
            if (arg instanceof Uint8Array) transfer.push(arg.buffer);
          }
          owner.post({ type: "osc", packet }, transfer);
        }
        return;
      }
    }
    // Everything else fans out structured-cloned (no transferables — a
    // buffer can only move to one port).
    this.broadcast(conn, { type: "osc", packet });
  }

  // ── rpc ─────────────────────────────────────────────────────────────────

  private rpc(client: Client, req: RpcRequest): RpcResult {
    const conn = client.conn;
    if (!conn) return { ok: false, error: "not joined" };
    switch (req.op) {
      case "alloc-nodes": {
        try {
          return { ok: true, value: this.allocNodes(conn) };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      }
      case "alloc-scope": {
        const recycled = conn.freeScopeSlots.pop();
        const index =
          recycled ??
          (conn.scopeUsed < conn.session.scopeIndexCount
            ? conn.session.scopeIndexBase + conn.scopeUsed++
            : undefined);
        if (index === undefined) {
          return {
            ok: false,
            error: `scope-slot block exhausted (${conn.session.scopeIndexCount} per session)`,
          };
        }
        client.scopeSlots.add(index);
        return { ok: true, value: index };
      }
      case "free-scope":
        this.freeScope(conn, req.index);
        client.scopeSlots.delete(req.index);
        return { ok: true };
      case "box-claim": {
        const owner = conn.boxOwners.get(req.boxId);
        if (owner && owner !== client) return { ok: true, value: { granted: false } };
        conn.boxOwners.set(req.boxId, client);
        client.boxes.add(req.boxId);
        return { ok: true, value: { granted: true } };
      }
      case "box-release":
        if (conn.boxOwners.get(req.boxId) === client) conn.boxOwners.delete(req.boxId);
        client.boxes.delete(req.boxId);
        return { ok: true };
      case "presets-put": {
        conn.presets.set(req.boxId, req.entry);
        const event: TransportEvent = { type: "presets", boxId: req.boxId, entry: req.entry };
        for (const member of conn.clients.values()) {
          if (member !== client) member.post(event);
        }
        return { ok: true };
      }
      case "presets-get":
        return { ok: true, value: conn.presets.get(req.boxId) ?? null };
    }
  }

  // ── allocators ──────────────────────────────────────────────────────────

  /** Carve the next node-id chunk from the session block (the last chunk may
   *  be short). Throws when the block is exhausted — a bug, the block is far
   *  larger than any realistic session needs. */
  private allocNodes(conn: Connection): { start: number; end: number } {
    const blockEnd = conn.session.nodeIdBase + conn.session.nodeIdCount;
    if (conn.nodeCursor >= blockEnd) throw new Error("node-id block exhausted");
    const start = conn.nodeCursor;
    const end = Math.min(start + NODE_ID_CHUNK, blockEnd);
    conn.nodeCursor = end;
    return { start, end };
  }

  /** Out-of-span and double frees are ignored — unload can race a
   *  reconnect's fresh span, and a stale index must not poison the list. */
  private freeScope(conn: Connection, index: number): void {
    const { scopeIndexBase, scopeIndexCount } = conn.session;
    if (index < scopeIndexBase || index >= scopeIndexBase + scopeIndexCount) return;
    if (!conn.freeScopeSlots.includes(index)) conn.freeScopeSlots.push(index);
  }
}
