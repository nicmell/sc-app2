// The app's OSC client consumes plain OSC packets from the worker, which owns
// both the WebSocket and binary codec. The interface provides
// (close/send/on/off/status), plus a promise-returning
// `connect(url, sessionId, session)`.
//
// One instance (`oscClient`) serves this CLIENT — realm-local: the
// dashboard, each box iframe, and each popped tab has its own, all members
// of the session's ONE shared connection (the SharedWorker owns the socket
// and the session-wide state; docs/multi-tab.md). `connect` JOINS that
// connection: the worker creates the session group once per socket, hands
// this client its node-id CHUNK (`nextNodeId` stays synchronous over it and
// prefetches refills), and namespaces this client's scope/clock
// subscription-id spaces by the joined clientId. Scope slots, box claims,
// and the live presets cache are worker-side, reached over the correlated
// RPC seam.
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
import { NODE_ID_REFILL_MARGIN, REPLY_TIMEOUT_MS, SUB_ID_SPACE } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { workerClient } from "./worker/WorkerClient";
import { TRANSPORT_STATUS } from "./worker/transport";
import type { BoxPresets } from "@/types/api";
import type { OscSession, RpcRequest, TransportEvent } from "@/types/osc";

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

  /** Next node id to hand out, within the joined chunk `[nextId, endId)`;
   *  `spareChunk` is the prefetched refill (see `nextNodeId`). */
  private nextId = 0;
  private endId = 0;
  private spareChunk: { start: number; end: number } | null = null;
  private refillPending = false;
  private groupId: number | null = null;
  /** The one Web Lock this page holds — its release tells the worker this
   *  client died. Acquired once, reused across reconnects. */
  private lockName: string | undefined;
  /** Monotonic /scope/subscribe subId in this client's space — never reused
   *  within a connection, so a freed slot's late chunk can't be
   *  misattributed to a new subscriber. */
  private nextSubId = 1;
  /** Pending one-shot reply waiters (FIFO per address+match). */
  private waiters: ReplyWaiter[] = [];
  /** /scope/chunk handlers keyed by subId (one per loaded sc-scope) — the
   *  decoded chunk dispatches straight to its subscriber from handleReply. */
  private scopeChunkSubs = new Map<number, (chunk: DecodedScopeChunk) => void>();
  /** Clock subscriptions outlive socket sessions; every open (fresh
   *  connection or worker respawn) replays them — the worker's re-subscribe
   *  is idempotent. */
  private clockSubs = new Map<number, { intervalMs: number; cb: () => void }>();
  private nextClockSubId = 1;
  private clockOffset = 0;
  /** Sibling clients' forwarded presets harvests (see `onBoxPresets`). */
  private presetsListeners = new Set<(boxId: string, entry: BoxPresets) => void>();

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
    if (event.type === "respawn" || event.type === "open") {
      // Replay the clock subscriptions on every (re)opened seam — a fresh
      // shared connection has none of ours, and the worker's re-subscribe is
      // idempotent for a surviving one. Replays restart their tick phase;
      // consumers only rely on the cadence.
      for (const [id, sub] of this.clockSubs) {
        workerClient.send(clockSubscribe(id, sub.intervalMs));
      }
      if (event.type === "open") this.emit("open");
    } else if (event.type === "joined") {
      // Membership granted (always before the connection's open): arm the
      // node-id chunk and this client's subscription-id spaces.
      this.nextId = event.nodes.start;
      this.endId = event.nodes.end;
      this.spareChunk = null;
      this.refillPending = false;
      this.nextSubId = event.clientId * SUB_ID_SPACE + 1;
      this.nextClockSubId = event.clientId * SUB_ID_SPACE + 1;
      this.scopeChunkSubs.clear(); // fresh subId space → drop leaked handlers
    } else if (event.type === "presets") {
      for (const listener of this.presetsListeners) listener(event.boxId, event.entry);
    } else if (event.type === "osc") {
      walkPacket(event.packet, (message) => this.handleReply(message));
    } else if (event.type === "error") {
      this.emit("error", new Error(event.message));
    } else if (event.type === "close") {
      this.emit("close", event);
    }
  }

  private emit<E extends ClientEvent>(event: E, ...args: ClientEventArgs[E]): void {
    for (const listener of this.listeners[event].values()) {
      listener(...(args as never[]));
    }
  }

  /** JOIN the session's shared connection (the first member's join opens
   *  the WebSocket; the worker creates the session group before broadcasting
   *  open, so `connected` subscribers always allocate into an existing
   *  group). The `joined` event — always ahead of open — arms the node-id
   *  chunk and id spaces (see handleTransportEvent). Resolves once the
   *  shared socket is open; rejects on an error or close before that. */
  connect(url: string, sessionId: string, session: OscSession): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const offAll = () => {
        this.off("open", onOpen);
        this.off("error", onError);
        this.off("close", onClose);
      };
      const onOpen = this.on("open", () => {
        offAll();
        this.groupId = session.sessionGroupId;
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
      void this.acquireLock().then((lockName) =>
        workerClient.join(url, sessionId, session, lockName),
      );
    });
  }

  /** Acquire (once per page) the Web Lock whose release signals this
   *  client's death to the worker. Held forever — the browser releases it
   *  when the page dies, crash included. Resolves undefined where Web Locks
   *  are unavailable (the dedicated-worker fallback needs no liveness). */
  private async acquireLock(): Promise<string | undefined> {
    if (this.lockName) return this.lockName;
    const locks = navigator.locks as LockManager | undefined;
    if (!locks) return undefined;
    const name = `sc-osc-client-${Math.random().toString(36).slice(2)}`;
    await new Promise<void>((acquired) => {
      void locks.request(name, () => {
        acquired();
        return new Promise(() => {}); // hold until page death
      });
    });
    this.lockName = name;
    return name;
  }

  /** The session's scsynth group (created on connect) — plugin groups and
   *  synths nest inside it. Throws before `connect`. */
  get sessionGroupId(): number {
    if (this.groupId === null) throw new Error("OscClient.sessionGroupId: not connected");
    return this.groupId;
  }

  /** One correlated side-band request to the worker; throws the worker's
   *  error message on a failed result. */
  private async rpc(req: RpcRequest): Promise<unknown> {
    const result = await workerClient.request(req);
    if (!result.ok) throw new Error(`OscClient.${req.op}: ${result.error}`);
    return result.value;
  }

  /** Allocate a scope-buffer slot from the session's span — worker-side
   *  (exact across the shared connection's clients; freed slots are reused
   *  first). Rejects when not joined or the span is exhausted — more live
   *  scopes than the per-session budget. */
  async allocScopeIndex(): Promise<number> {
    return (await this.rpc({ op: "alloc-scope" })) as number;
  }

  /** Return a slot to the worker's allocator (scope tap torn down).
   *  Fire-and-forget; out-of-span and double frees are ignored worker-side —
   *  unload can race a reconnect's fresh span, and a stale index must not
   *  poison the free list. */
  freeScopeIndex(index: number): void {
    void workerClient.request({ op: "free-scope", index }).catch(() => {});
  }

  /** Set a contiguous control-array run on a live node (/n_setn) — the
   *  live-envelope update. Sent to a GROUP, scsynth fans it out to every
   *  synth inside that carries the named control. */
  setControln(nodeId: number, name: string, values: readonly number[]): void {
    this.send(nSetn(nodeId, [name, values.length, ...values]));
  }

  /** Allocate the next node id from this client's joined chunk —
   *  synchronous over the chunk, with an async refill prefetched at the
   *  watermark so a full plugin load can't outrun the round-trip. Throws
   *  before `connect` and if the chunk runs dry before a refill lands (a
   *  bug — the chunk far exceeds any realistic burst). */
  nextNodeId(): number {
    if (this.endId === 0) throw new Error("OscClient.nextNodeId: not connected");
    if (this.nextId >= this.endId) {
      if (!this.spareChunk) {
        throw new Error("OscClient.nextNodeId: node-id block exhausted");
      }
      this.nextId = this.spareChunk.start;
      this.endId = this.spareChunk.end;
      this.spareChunk = null;
    }
    const id = this.nextId++;
    if (this.endId - this.nextId < NODE_ID_REFILL_MARGIN) this.prefetchNodes();
    return id;
  }

  /** Prefetch the next node-id chunk (at most one in flight; a failure just
   *  retries on the next watermark hit). */
  private prefetchNodes(): void {
    if (this.refillPending || this.spareChunk) return;
    this.refillPending = true;
    void this.rpc({ op: "alloc-nodes" })
      .then((chunk) => {
        this.spareChunk = chunk as { start: number; end: number };
      })
      .catch(() => {})
      .finally(() => {
        this.refillPending = false;
      });
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

  // ── shared-session box + presets seam (docs/multi-tab.md) ───────────────

  /** Claim exclusive ownership of a box (phase-one ownership: one client
   *  loads a box's plugin at a time). False = another live client holds it.
   *  Claims release on `releaseBox`, leave, or client death. */
  async claimBox(boxId: string): Promise<boolean> {
    return ((await this.rpc({ op: "box-claim", boxId })) as { granted: boolean }).granted;
  }

  /** Release a box claim (fire-and-forget — death releases it anyway). */
  releaseBox(boxId: string): void {
    void workerClient.request({ op: "box-release", boxId }).catch(() => {});
  }

  /** Push a box's harvested presets to the worker's live cache; siblings
   *  receive it via `onBoxPresets` (the dashboard mirrors it into its
   *  presets slice for the autosave). */
  putBoxPresets(boxId: string, entry: BoxPresets): void {
    void workerClient.request({ op: "presets-put", boxId, entry }).catch(() => {});
  }

  /** The worker's live presets entry for a box — fresher than the saved
   *  session data when a sibling harvested since the last autosave. */
  async getBoxPresets(boxId: string): Promise<BoxPresets | null> {
    return (await this.rpc({ op: "presets-get", boxId })) as BoxPresets | null;
  }

  /** Subscribe to sibling clients' forwarded presets harvests. */
  onBoxPresets(cb: (boxId: string, entry: BoxPresets) => void): () => void {
    this.presetsListeners.add(cb);
    return () => this.presetsListeners.delete(cb);
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
