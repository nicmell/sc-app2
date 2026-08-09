// The app's OSC client consumes plain OSC packets from the worker, which owns
// both the WebSocket and binary codec. The interface provides
// (open/close/send/on/off/status), plus a promise-returning
// `connect(url, session)`.
//
// One global instance (`oscClient`) serves the whole frontend — the
// SessionManager starts the connection once `POST /api/session` yields the WS
// URL + session block, and consumers (the sc-elements, …) subscribe to
// addresses directly. On connect the client creates the session's scsynth group itself
// (`/g_new` at the tail of scsynth's root group — sessions always start
// fresh; the bridge ends them when the WebSocket closes) and owns node-id
// allocation from the session's server-assigned block (`nextNodeId`).
//
// Its public events expose transport lifecycle without coupling protocol
// consumers to transport middleware concerns.

import {
  ADDR_N_GO,
  ADDR_SYNCED,
  AddToTail,
  CLOCK_STATUS_ADDRESS,
  CLOCK_TICK_ADDRESS,
  ClockStatus,
  ClockTick,
  clockSubscribe,
  clockUnsubscribe,
  dFree,
  dRecv,
  gFreeAll,
  gNewOne,
  nFree,
  NodeEvent,
  nRunOne,
  nSet,
  nSetn,
  parseScopeChunkArgs,
  SCOPE_CHUNK_ADDRESS,
  scopeSubscribe,
  scopeUnsubscribe,
  sNewPairs,
  sync,
  Synced,
  type DecodedScopeChunk,
  type OscMessage,
  type OscPacket,
  walkPacket,
} from "@sc-app/server-commands";
import { REPLY_TIMEOUT_MS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { workerClient } from "./worker/WorkerClient";
import { TRANSPORT_STATUS } from "./worker/transport";
import type { OscSession, TransportEvent } from "@/types/osc";

/** A pending `once()` reply waiter, matched in `handleReply`. */
interface ReplyWaiter {
  address: string;
  match: (msg: OscMessage) => boolean;
  resolve: (msg: OscMessage) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

type ClientEventArgs = {
  open: [];
  close: [info?: { code?: number; reason?: string }];
  error: [error: Error];
};
type ClientEvent = keyof ClientEventArgs;
type StoredListener = (...args: never[]) => void;

export class OscClient {
  private readonly listeners: { [K in ClientEvent]: Map<number, StoredListener> } = {
    open: new Map(),
    close: new Map(),
    error: new Map(),
  };
  private nextListenerId = 1;

  /** The OSC slice of the single app store. */
  private readonly state = appStore.slice(SliceName.OSC);
  /** Transport-level "connection ready": the session group exists and the
   *  node-id allocator is armed. The plugins reload/unload on it. */
  readonly connected = this.state.select((s) => s.connected);

  /** Next node id to hand out, within `[nodeIdBase, nodeIdEnd)`. */
  private nextId = 0;
  private endId = 0;
  private groupId: number | null = null;
  /** The session's scope-slot span (armed on connect) + free-list allocator. */
  private scopeBase = 0;
  private scopeCount = 0;
  private scopeUsed = 0;
  private freeScopeSlots: number[] = [];
  /** Monotonic /scope/subscribe subId — never reused within a connection, so
   *  a freed slot's late chunk can't be misattributed to a new subscriber. */
  private nextSubId = 1;
  /** Pending one-shot reply waiters (FIFO per address+match). */
  private waiters: ReplyWaiter[] = [];
  /** /scope/chunk handlers keyed by subId (one per loaded sc-scope) — the
   *  decoded chunk dispatches straight to its subscriber from handleReply. */
  private scopeChunkSubs = new Map<number, (chunk: DecodedScopeChunk) => void>();
  /** Clock subscriptions outlive socket sessions; worker respawn replays them. */
  private clockSubs = new Map<number, { intervalMs: number; cb: () => void }>();
  private nextClockSubId = 1;
  private clockOffset = 0;

  constructor() {
    workerClient.onEvent((event) => this.handleTransportEvent(event));
    // A transport error is critical: terminate the session
    // by closing — the bridge frees the session group on WS close. Pre-open
    // failures belong to connect()'s promise, so only close an open socket.
    this.on("error", () => {
      if (this.status() === TRANSPORT_STATUS.IS_OPEN) this.close();
    });
    this.on("close", () => {
      // Whatever the reason, no reply is coming anymore: fail pending
      // waiters now instead of letting them run out their timeouts, and let
      // connected subscribers tear down from the single transport seam.
      this.rejectWaiters(new Error("OscClient.once: connection closed"));
      this.state.update((s) => ({ ...s, connected: false }));
    });
  }

  private handleTransportEvent(event: TransportEvent): void {
    if (event.type === "respawn") {
      // Replayed subscriptions restart their tick phase — fine for a
      // crash-recovery path; consumers only rely on the cadence.
      for (const [id, sub] of this.clockSubs) {
        workerClient.send(clockSubscribe(id, sub.intervalMs));
      }
    } else if (event.type === "osc") {
      walkPacket(event.packet, (message) => this.handleReply(message));
    } else if (event.type === "error") {
      this.emit("error", new Error(event.message));
    } else if (event.type === "close") {
      this.emit("close", event);
    } else if (event.type === "open") {
      this.emit("open");
    }
  }

  private emit<E extends ClientEvent>(event: E, ...args: ClientEventArgs[E]): void {
    for (const listener of this.listeners[event].values()) {
      listener(...(args as never[]));
    }
  }

  /** Open the WebSocket (via the worker) to `url`; once open, create the
   *  session's group at the tail of scsynth's root group, arm the node-id
   *  allocator over the session's block, and flag `connected` (which arms the
   *  plugin reloads and the status watchdog). Resolves once the socket is
   *  open; rejects on an error or close before that. */
  connect(url: string, session: OscSession): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const offAll = () => {
        this.off("open", onOpen);
        this.off("error", onError);
        this.off("close", onClose);
      };
      const onOpen = this.on("open", () => {
        offAll();
        this.nextId = session.nodeIdBase;
        this.endId = session.nodeIdBase + session.nodeIdCount;
        this.groupId = session.sessionGroupId;
        this.scopeBase = session.scopeIndexBase;
        this.scopeCount = session.scopeIndexCount;
        this.scopeUsed = 0;
        this.freeScopeSlots = [];
        this.nextSubId = 1; // fresh subId space → drop any leaked handlers
        this.scopeChunkSubs.clear();
        // The session is freshly minted (it dies with the previous WebSocket),
        // so its group never pre-exists: create it at the tail of scsynth's
        // root group, after SuperDirt's output monitors.
        this.send(gNewOne(session.sessionGroupId, AddToTail, 0));
        // Flag readiness only after /g_new, so subscribers (plugin reloads)
        // allocate and send into an existing group.
        this.state.update((s) => ({ ...s, connected: true }));
        resolve();
      });
      const onError = this.on("error", (err: unknown) => {
        offAll();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
      const onClose = this.on("close", () => {
        offAll();
        reject(new Error("websocket closed before open"));
      });
      workerClient.open(url);
    });
  }

  /** The session's scsynth group (created on connect) — plugin groups and
   *  synths nest inside it. Throws before `connect`. */
  get sessionGroupId(): number {
    if (this.groupId === null) throw new Error("OscClient.sessionGroupId: not connected");
    return this.groupId;
  }

  /** Allocate a scope-buffer slot from the session's server-assigned span
   *  (freed slots are reused first). Throws before `connect` and when the
   *  span is exhausted — more live scopes than the per-session budget. */
  allocScopeIndex(): number {
    if (this.scopeCount === 0) throw new Error("OscClient.allocScopeIndex: not connected");
    const recycled = this.freeScopeSlots.pop();
    if (recycled !== undefined) return recycled;
    if (this.scopeUsed >= this.scopeCount) {
      throw new Error(
        `OscClient.allocScopeIndex: scope-slot block exhausted (${this.scopeCount} per session)`,
      );
    }
    return this.scopeBase + this.scopeUsed++;
  }

  /** Return a slot to the allocator (scope tap torn down). */
  freeScopeIndex(index: number): void {
    if (index < this.scopeBase || index >= this.scopeBase + this.scopeCount) return;
    if (!this.freeScopeSlots.includes(index)) this.freeScopeSlots.push(index);
  }

  /** Set a contiguous control-array run on a live node (/n_setn) — the
   *  live-envelope update. Sent to a GROUP, scsynth fans it out to every
   *  synth inside that carries the named control. */
  setControln(nodeId: number, name: string, values: readonly number[]): void {
    this.send(nSetn(nodeId, [name, values.length, ...values]));
  }

  /** Allocate the next node id from the session's server-assigned block.
   *  Throws before `connect` and if the block is exhausted (a bug — the range
   *  is far larger than any realistic session needs). */
  nextNodeId(): number {
    if (this.endId === 0) throw new Error("OscClient.nextNodeId: not connected");
    if (this.nextId >= this.endId) throw new Error("OscClient.nextNodeId: node-id block exhausted");
    return this.nextId++;
  }

  /** Request an orderly transport close. The transport's synthesized close
   *  event performs client teardown; sends triggered afterward are dropped,
   *  and the bridge frees the session group when the WebSocket closes. */
  close(): void {
    workerClient.close();
  }

  /** Pack and send an OSC message/bundle over the worker's WebSocket. Dropped
   *  while not open. */
  send(packet: OscPacket): void {
    if (this.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    workerClient.send(packet);
  }

  /** Subscribe to a connection event. Returns a subscription id for `off`. */
  on<E extends ClientEvent>(event: E, callback: (...args: ClientEventArgs[E]) => void): number {
    const id = this.nextListenerId++;
    this.listeners[event].set(id, callback as StoredListener);
    return id;
  }

  /** Remove a subscription made with `on`. */
  off(event: ClientEvent, subscriptionId: number): boolean {
    return this.listeners[event].delete(subscriptionId);
  }

  /** Wait for one inbound reply on `address` satisfying `match`. Resolves
   *  with the message; rejects after `timeoutMs` or when the connection
   *  closes. Register BEFORE the `send()` that prompts the reply — the reply
   *  can race in otherwise. One matching reply resolves exactly one waiter
   *  (FIFO). The sequenced-command primitive under the command methods
   *  below (`/d_recv` → `/synced`, `/s_new`–`/g_new` → `/n_go`). */
  once(
    address: string,
    match: (msg: OscMessage) => boolean = () => true,
    timeoutMs: number = REPLY_TIMEOUT_MS,
  ): Promise<OscMessage> {
    return new Promise<OscMessage>((resolve, reject) => {
      const waiter: ReplyWaiter = {
        address,
        match,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          reject(new Error(`OscClient.once: timed out waiting for ${address}`));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  /** Fail every pending waiter (connection gone — no replies are coming). */
  private rejectWaiters(err: Error): void {
    const pending = this.waiters;
    this.waiters = [];
    for (const w of pending) {
      clearTimeout(w.timer);
      w.reject(err);
    }
  }

  // ── scsynth command methods ─────────────────────────────────────────────
  //
  // The sc-elements' whole OSC vocabulary: every sequenced send + its reply
  // wait lives here (node ids allocated internally), the elements only await
  // the returned promises. Fire-and-forget teardown stays void.

  /** Create a group at the tail of `targetId`; resolves with the new node id
   *  once its `/n_go` confirms. */
  async createGroup(targetId: number): Promise<number> {
    const nodeId = this.nextNodeId();
    const reply = this.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === nodeId);
    this.send(gNewOne(nodeId, AddToTail, targetId));
    await reply;
    return nodeId;
  }

  /** Free a group's contents, then the group node itself. */
  freeGroup(groupId: number): void {
    this.send(gFreeAll(groupId));
    this.send(nFree(groupId));
  }

  /** Pause (0) / resume (1) a node — fire-and-forget (/n_run has no reply;
   *  the node-lifecycle notifications ride /notify). */
  setNodeRun(nodeId: number, flag: 0 | 1): void {
    this.send(nRunOne(nodeId, flag));
  }

  /** Install a compiled synthdef; resolves once its embedded `/sync`
   *  completion round-trips (`/synced` matched by a syncId from the
   *  session's node-id block — unique across WS clients for free). */
  async sendSynthDef(bytes: Uint8Array): Promise<void> {
    const syncId = this.nextNodeId();
    const reply = this.once(ADDR_SYNCED, (m) => Synced.syncId(m) === syncId);
    this.send(dRecv(bytes, sync(syncId)));
    await reply;
  }

  /** Remove an installed synthdef by name. */
  freeSynthDef(name: string): void {
    this.send(dFree(name));
  }

  /** Create a synth at the tail of `targetId` with ALL its controls baked
   *  into the ONE /s_new — scalars as name pairs, ARRAY controls as
   *  consecutive (integer-index, value) pairs from each array's base param
   *  index (/s_new accepts "a control index or name" per pair). The voice
   *  therefore never computes a block with a stale array — no post-create
   *  seed, no race. Resolves with the new node id once /n_go confirms. */
  async createSynth(
    defName: string,
    targetId: number,
    controls: Record<string, number>,
    arrayControls: ReadonlyArray<{ index: number; values: readonly number[] }> = [],
  ): Promise<number> {
    const nodeId = this.nextNodeId();
    const reply = this.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === nodeId);
    const pairs: Array<[string | number, number]> = Object.entries(controls);
    for (const { index, values } of arrayControls) {
      values.forEach((value, i) => pairs.push([index + i, value]));
    }
    this.send(sNewPairs(defName, nodeId, AddToTail, targetId, pairs));
    try {
      await reply;
    } catch (err) {
      // The /s_new is already SENT: on a lost/late ack the node may exist
      // with nobody holding its id — and a gated voice would sustain
      // FOREVER. Free it fire-and-forget: a no-node /fail is noise, an
      // untracked drone is not. (A closed connection drops the send.)
      this.freeSynth(nodeId);
      throw err;
    }
    return nodeId;
  }

  /** Set one control on a live node. */
  setControl(nodeId: number, name: string, value: number): void {
    this.send(nSet(nodeId, { [name]: value }));
  }

  /** Free a single node (a scope tap's teardown). */
  freeSynth(nodeId: number): void {
    this.send(nFree(nodeId));
  }

  /** Start a scope-slot chunk stream (the bridge intercepts the message —
   *  no scsynth reply). The handler is registered under the minted subId
   *  BEFORE the subscribe is sent (no arrival race), and decoded
   *  `/scope/chunk` frames dispatch to it straight from `handleReply` (also
   *  the unit-test seam). Returns the subId + `off`, which drops the handler
   *  and stops the bridge stream. */
  subscribeScope(
    scope: number,
    channels: number,
    chunkSize: number,
    onChunk: (chunk: DecodedScopeChunk) => void,
  ): { subId: number; off: () => void } {
    const subId = this.nextSubId++;
    this.scopeChunkSubs.set(subId, onChunk);
    this.send(scopeSubscribe({ subId, scope, channels, chunkSize }));
    return {
      subId,
      off: () => {
        if (this.scopeChunkSubs.delete(subId)) this.send(scopeUnsubscribe(subId));
      },
    };
  }

  /** Start an absolute-phase tick stream in the worker. Unlike scope streams,
   *  clock subscriptions survive socket reconnects and worker respawns. */
  subscribeClock(intervalMs: number, cb: () => void): { id: number; off: () => void } {
    const id = this.nextClockSubId++;
    this.clockSubs.set(id, { intervalMs, cb });
    workerClient.send(clockSubscribe(id, intervalMs));
    return {
      id,
      off: () => {
        if (this.clockSubs.delete(id)) workerClient.send(clockUnsubscribe(id));
      },
    };
  }

  /** Bridge-wall-clock milliseconds. Offset is zero before sync/disconnected. */
  clockNow(): number {
    return Date.now() + this.clockOffset;
  }

  /** Connection status (a `TRANSPORT_STATUS` value). */
  status(): number {
    return workerClient.status();
  }

  /** Route an inbound reply to protocol consumers. Public for unit tests —
   *  normally fed by worker packet events. */
  handleReply(reply: OscMessage): void {
    if (reply.address === CLOCK_TICK_ADDRESS) {
      this.clockSubs.get(ClockTick.id(reply))?.cb();
      return;
    }
    if (reply.address === CLOCK_STATUS_ADDRESS) {
      const offset = ClockStatus.offset(reply);
      const rtt = ClockStatus.rtt(reply);
      if (Number.isFinite(offset) && Number.isFinite(rtt)) {
        this.clockOffset = offset;
      }
      return;
    }
    // One-shot waiters first — the message still falls through to the
    // protocol routing below (transport middleware has already observed it).
    const waiter = this.waiters.find((w) => w.address === reply.address && w.match(reply));
    if (waiter) {
      this.waiters = this.waiters.filter((w) => w !== waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(reply);
    }
    if (reply.address === SCOPE_CHUNK_ADDRESS) {
      // Streams at ~47 Hz per scope: dispatch by subId to the sc-scope
      // subscriber and keep it out of the console log.
      if (this.scopeChunkSubs.size > 0) {
        let chunk: DecodedScopeChunk;
        try {
          chunk = parseScopeChunkArgs(reply.args);
        } catch (err) {
          console.error("[osc] bad /scope/chunk:", err);
          return;
        }
        this.scopeChunkSubs.get(chunk.subId)?.(chunk);
      }
      return;
    }
  }
}

/** The one OSC client for the whole frontend. The WebSocket only opens on the
 *  first `connect` (the permanent worker behind it is spawned by the
 *  WorkerClient module at import). */
export const oscClient = new OscClient();
