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
// The client also owns the whole OSC telemetry domain — the `osc` slice of the
// app store: the bounded tx/rx console log, the `/fail`–`/late` error banners,
// scsynth's `/status.reply` load, and the transport-level `connected` signal
// consumers arm on (the plugins reload/unload with it). And it polices
// its own connection: a critical transport error or a missed `/status.reply`
// heartbeat terminates the session by closing the WebSocket — the
// SessionManager only observes the close.

import {
  ADDR_N_GO,
  ADDR_SYNCED,
  AddToTail,
  CLOCK_STATUS_ADDRESS,
  CLOCK_TICK_ADDRESS,
  ClockTick,
  clockSubscribe,
  clockUnsubscribe,
  dFree,
  dRecv,
  flattenPacket,
  formatOscArg,
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
  type OscArg,
  type OscMessage,
  type OscPacket,
} from "@sc-app/server-commands";
import {
  MAX_ERRORS,
  MAX_LOG,
  CLOCK_WATCHDOG_INTERVAL_MS,
  OSC_REPLIES,
  REPLY_TIMEOUT_MS,
  STATUS_REPLY_TIMEOUT_MS,
} from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { workerClient } from "./worker/WorkerClient";
import { TRANSPORT_STATUS } from "./worker/transport";
import type { OscSession, TransportEvent } from "@/types/osc";
import type { ScsynthStatus } from "@/types/stores";

/** Parse a `/status.reply`'s args. Layout (scsynth):
 *  `[1, ugens, synths, groups, defs, avgCpu, peakCpu, srNominal, srActual]`. */
function parseStatus(args: ReadonlyArray<OscArg>): ScsynthStatus {
  return {
    avgCpu: Number(args[5]) || 0,
    peakCpu: Number(args[6]) || 0,
    sampleRate: Number(args[8]) || 0,
    numUgens: Number(args[1]) || 0,
    numSynths: Number(args[2]) || 0,
    numGroups: Number(args[3]) || 0,
  };
}

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
  readonly log = this.state.select((s) => s.log);
  readonly errors = this.state.select((s) => s.errors);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);
  readonly clock = this.state.select((s) => s.clock);

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
  /** Stable React keys for log entries and banners. */
  private nextEntryId = 0;
  /** The `/status.reply` watchdog runs from the worker's unthrottled clock. */
  private watchdogOff: (() => void) | null = null;
  private lastStatusAt = 0;
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
    // A transport error is critical: surface it, then terminate the session
    // by closing — the bridge frees the session group on WS close. Pre-open
    // failures belong to connect()'s promise, so only close an open socket.
    this.on("error", (err) => {
      console.error("[osc] transport error:", err);
      this.pushError("websocket", err instanceof Error ? err.message : String(err), "error");
      if (this.status() === TRANSPORT_STATUS.IS_OPEN) this.close();
    });
    // Diagnose abnormal closes: only a real socket close carries a code (the
    // WorkerClient's synthesized orderly close doesn't), and 1000 is a normal
    // closure — anything else gets a banner saying why the connection died.
    this.on("close", (info) => {
      // Whatever the reason, no reply is coming anymore: fail pending
      // waiters now instead of letting them run out their timeouts.
      this.rejectWaiters(new Error("OscClient.once: connection closed"));
      if (!info?.code || info.code === 1000) return;
      const message = `connection closed (${info.code}${info.reason ? `: ${info.reason}` : ""})`;
      console.warn(`[osc] ${message}`);
      this.pushError("websocket", message, "warn");
    });
  }

  private handleTransportEvent(event: TransportEvent): void {
    if (event.type === "respawn") {
      for (const [id, sub] of this.clockSubs) {
        workerClient.send(clockSubscribe(id, sub.intervalMs));
      }
    } else if (event.type === "osc") {
      this.walkMessages(event.packet);
    } else if (event.type === "error") {
      this.emit("error", new Error(event.message));
    } else if (event.type === "close") {
      this.emit("close", event);
    } else if (event.type === "open") {
      this.emit("open");
    }
  }

  private walkMessages(packet: OscPacket): void {
    if ("timetag" in packet) {
      for (const child of packet.packets) this.walkMessages(child);
    } else {
      this.handleReply(packet);
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
    // Fresh connection, fresh telemetry: drop the dead connection's load and
    // banners. The console log deliberately survives reconnects.
    this.state.update((s) => ({ ...s, scsynthStatus: null, errors: [] }));
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
        this.armWatchdog();
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

  /** Close the connection (and the worker behind it). Dropping `connected`
   *  first lets subscribers send their teardown while the
   *  socket is still open — harmlessly dropped when the transport is already
   *  dead, since the bridge frees the whole session group on WS close. */
  close(): void {
    this.disarmWatchdog();
    this.rejectWaiters(new Error("OscClient.once: connection closed"));
    this.state.update((s) => ({ ...s, connected: false }));
    workerClient.close();
  }

  /** Pack and send an OSC message/bundle over the worker's WebSocket, logging
   *  each flattened message as `tx`. Dropped (unlogged) while not open. */
  send(packet: OscPacket): void {
    if (this.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
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

  /** Dismiss one banner by id (the toast's × / auto-dismiss timer). */
  dismissError(id: number): void {
    this.state.update((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) }));
  }

  /** Drop every banner. */
  clearErrors(): void {
    this.state.update((s) => ({ ...s, errors: [] }));
  }

  /** Route an inbound reply: `/status.reply` feeds the watchdog + the
   *  scsynth-status view (and is kept out of the console); `/scope/chunk`
   *  streams at ~47 Hz and is consumed by the sc-scope elements' own
   *  subscription, so only the console log skips it; `/fail` and `/late`
   *  additionally raise a banner; everything else is logged as `rx`.
   *  Public for unit tests — normally fed by worker packet events. */
  handleReply(reply: OscMessage): void {
    if (reply.address === CLOCK_TICK_ADDRESS) {
      this.clockSubs.get(ClockTick.id(reply))?.cb();
      return;
    }
    if (reply.address === CLOCK_STATUS_ADDRESS) {
      const offset = Number(reply.args[0]);
      const rtt = Number(reply.args[1]);
      if (Number.isFinite(offset) && Number.isFinite(rtt)) {
        this.clockOffset = offset;
        this.state.update((s) => ({ ...s, clock: { offset, rtt } }));
      }
      return;
    }
    // One-shot waiters first — the message still falls through to the
    // telemetry routing below (a /synced or /n_go someone awaits is logged
    // like any other reply).
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
    if (reply.address === OSC_REPLIES.STATUS) {
      const next = parseStatus(reply.args);
      this.state.update((s) => ({ ...s, scsynthStatus: next }));
      this.lastStatusAt = performance.now();
      return;
    }
    // `/fail <command> <error> [extras…]` and `/late <seconds>` are mirrored to
    // the browser console so every failure is visible there, and also raise a
    // toast banner. Either way they still fall through to the OSC console as
    // the full history.
    if (reply.address === OSC_REPLIES.FAIL) {
      const command = formatOscArg(reply.args[0] ?? "?");
      const message = formatOscArg(reply.args[1] ?? "(no message)");
      console.error(`[scsynth] ${command}: ${message}`);
      this.pushError(command, message, "error");
    } else if (reply.address === OSC_REPLIES.LATE) {
      const seconds = Number(reply.args[0]) || 0;
      const message = `bundle ran ${seconds.toFixed(3)}s late`;
      console.warn(`[scsynth] /late: ${message}`);
      this.pushError("/late", message, "warn");
    }
    this.append("rx", reply.address, reply.args.map(formatOscArg));
  }

  /** Arm the heartbeat watchdog on the worker clock so background throttling
   *  cannot postpone detection of a dead scsynth connection. */
  private armWatchdog(): void {
    this.disarmWatchdog();
    this.lastStatusAt = performance.now();
    this.watchdogOff = this.subscribeClock(CLOCK_WATCHDOG_INTERVAL_MS, () => {
      if (
        !this.connected.get() ||
        performance.now() - this.lastStatusAt <= STATUS_REPLY_TIMEOUT_MS
      ) {
        return;
      }
      const message = `no ${OSC_REPLIES.STATUS} for ${STATUS_REPLY_TIMEOUT_MS / 1000}s — connection closed`;
      console.error(`[osc] ${message}`);
      this.pushError(OSC_REPLIES.STATUS, message, "error");
      this.close();
    }).off;
  }

  private disarmWatchdog(): void {
    this.watchdogOff?.();
    this.watchdogOff = null;
  }

  /** Add a banner, coalescing an identical (address + message) one into a
   *  bumped count + refreshed timestamp (which restarts its auto-dismiss). */
  private pushError(address: string, message: string, variant: "error" | "warn"): void {
    this.state.update((s) => {
      const existing = s.errors.find((e) => e.address === address && e.message === message);
      const errors = existing
        ? s.errors.map((e) => (e === existing ? { ...e, count: e.count + 1, ts: Date.now() } : e))
        : [
            ...s.errors,
            { id: this.nextEntryId++, address, message, variant, count: 1, ts: Date.now() },
          ].slice(-MAX_ERRORS);
      return { ...s, errors };
    });
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.state.update((s) => ({
      ...s,
      log: [...s.log, { ts: Date.now(), dir, address, args, id: this.nextEntryId++ }].slice(
        -MAX_LOG,
      ),
    }));
  }
}

/** The one OSC client for the whole frontend. The WebSocket only opens on the
 *  first `connect` (the permanent worker behind it is spawned by the
 *  WorkerClient module at import). */
export const oscClient = new OscClient();
