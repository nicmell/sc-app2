// The worker-resident OSC engine: all packet work, sequencing, allocation
// and watchdog state live HERE — colocated with the socket and exempt from
// the main thread's background-tab timer throttling. Encode/decode is the
// wasm component (@sc-app/server-commands): typed ServerMessage values go
// out, typed ServerReply values come in, and everything downstream — the
// `once(address, match)` waiters, telemetry arms, log rendering — consume the
// single decode. State/UI live across the port in OscClientProxy; this
// class only emits `OscClientEvents`. See lib/osc/README.md for the split.

import {
  AddToTail,
  atUnixMs,
  decodeReplyPacket,
  decodeRawPacket,
  describeEncoded,
  dFree,
  dirtPlay,
  dRecv,
  encodeBundle,
  formatOscArg,
  gFreeAll,
  gNew,
  nFree,
  nRun,
  nSet,
  nSetn,
  scopeSubscribe,
  scopeUnsubscribe,
  sNew,
  sync,
  type OscTimetag,
  type ScopeChunkReply,
  type ServerReply,
} from "@sc-app/server-commands";
import { REPLY_TIMEOUT_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import type { OscSession } from "@/types/osc";
import type { OscLogEntry, ScsynthStatus } from "@/types/stores";
import { TRANSPORT_STATUS, createWsTransport, type WorkerTransport } from "./transport";

type ReplyAddress = ServerReply["address"];
type ReplyOf<A extends ReplyAddress> = Extract<ServerReply, { address: A }>;

/** A pending `once()` — matched in `handleReply` by the reply's wire
 *  ADDRESS (the serde tag) + a payload predicate. Stored type-erased;
 *  `once()` is the typed constructor. */
interface ReplyWaiter {
  address: string;
  match: (reply: never) => boolean;
  resolve: (reply: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
export interface OscClientEvents {
  open(): void;
  closed(code?: number, reason?: string): void;
  log(entries: OscLogEntry[]): void;
  banner(address: string, message: string, variant: "error" | "warn"): void;
  status(status: ScsynthStatus): void;
  scopeChunk(subId: number, chunk: ScopeChunkReply): void;
}
const noopEvents: OscClientEvents = {
  open() {},
  closed() {},
  log() {},
  banner() {},
  status() {},
  scopeChunk() {},
};

export class OscClient {
  private nextId = 0;
  private endId = 0;
  private waiters: ReplyWaiter[] = [];
  private statusTimer: ReturnType<typeof setTimeout> | null = null;
  private logQueue: OscLogEntry[] = [];
  private logScheduled = false;
  private openResolve: (() => void) | null = null;
  private openReject: ((error: Error) => void) | null = null;
  constructor(
    private readonly events: OscClientEvents = noopEvents,
    private readonly transport: WorkerTransport = createWsTransport(),
  ) {
    transport.onEvent((event) => {
      if (event.type === "open") {
        this.events.open();
        this.openResolve?.();
        this.openResolve = this.openReject = null;
      } else if (event.type === "message") {
        // One typed reply per contained message (bundles split in the
        // component); a malformed packet is a transport-level failure.
        try {
          const bytes = new Uint8Array(event.data);
          const replies = decodeReplyPacket(bytes);
          const needsLog = replies.some(
            (reply) => reply.address !== "/scope/chunk" && reply.address !== "/status.reply",
          );
          const raw = needsLog ? decodeRawPacket(bytes) : [];
          for (const [index, reply] of replies.entries()) {
            this.handleReply(reply, raw[index]);
          }
        } catch (err) {
          this.transportError(err);
        }
      } else if (event.type === "error") this.transportError(new Error(event.message));
      else this.closed(event.code, event.reason);
    });
  }
  /** Open the socket, arm the node-id allocator over the session's block,
   *  and create the session group at the tail of scsynth's root group. The
   *  server pre-assigned the group id, so no ack gates the send — the
   *  bridge rejects a wrong one. */
  async connect(url: string, session: OscSession): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.openResolve = resolve;
      this.openReject = reject;
      this.transport.open(url);
    });
    this.nextId = session.nodeIdBase;
    this.endId = session.nodeIdBase + session.nodeIdCount;
    this.send(gNew([[session.sessionGroupId, AddToTail, 0]]));
    this.armWatchdog();
  }

  /** Claim the next id from the session's server-assigned block — loud
   *  before connect and on exhaustion (ids are never recycled; the block
   *  is sized for a session's lifetime). */
  nextNodeId(): number {
    if (this.endId === 0) throw new Error("OscClient.nextNodeId: not connected");
    if (this.nextId >= this.endId) throw new Error("OscClient.nextNodeId: node-id block exhausted");
    return this.nextId++;
  }
  /** Orderly shutdown. `closed` is only emitted when the socket was still
   *  live — after a real socket drop the transport's close event already
   *  announced it, and a second event would re-notify subscribers. */
  close(): void {
    this.disarmWatchdog();
    // A connect awaiting open never settles otherwise: the disposed
    // transport emits no close event (handlers are nulled).
    this.openReject?.(new Error("websocket closed before open"));
    this.openResolve = this.openReject = null;
    this.rejectWaiters(new Error("OscClient.once: connection closed"));
    const status = this.transport.status();
    const wasLive =
      status === TRANSPORT_STATUS.IS_OPEN || status === TRANSPORT_STATUS.IS_CONNECTING;
    this.transport.close();
    if (wasLive) this.events.closed();
  }
  send(bytes: Uint8Array): void {
    if (this.transport.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    this.appendTx(bytes);
    this.transport.send(bytes);
  }
  /** Send several already-encoded commands as one timetagged bundle (pure
   *  byte framing) — scsynth applies them atomically at the tag. Logged
   *  per contained message. */
  sendBundle(time: OscTimetag, elements: Uint8Array[]): void {
    if (this.transport.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    for (const element of elements) this.appendTx(element);
    this.transport.send(encodeBundle(time, elements));
  }
  /** Await the next reply of `tag` whose payload satisfies `match` —
   *  registered BEFORE the triggering send (the sequenced-command
   *  invariant), one-shot FIFO per match, rejecting on timeout or close so
   *  a load pass fails loudly instead of wedging. */
  once<A extends ReplyAddress>(
    address: A,
    match: (reply: ReplyOf<A>) => boolean = () => true,
    timeoutMs = REPLY_TIMEOUT_MS,
  ): Promise<ReplyOf<A>> {
    return new Promise((resolve, reject) => {
      const waiter: ReplyWaiter = {
        address,
        match: match,
        resolve: resolve as (reply: unknown) => void,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          reject(new Error(`OscClient.once: timed out waiting for ${address}`));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }
  private rejectWaiters(err: Error) {
    const pending = this.waiters;
    this.waiters = [];
    for (const waiter of pending) {
      clearTimeout(waiter.timer);
      waiter.reject(err);
    }
  }
  // ── sequenced commands (the RPC surface) ────────────────────────────────
  // Each composes allocate → register waiter → send → await ack as one
  // worker-side unit, so the waiter can never race its own trigger.

  /** `/g_new` gated on the `/n_go` ack. */
  async createGroup(targetId: number): Promise<number> {
    const id = this.nextNodeId();
    const reply = this.once("/n_go", (n) => n.args.nodeId === id);
    this.send(gNew([[id, AddToTail, targetId]]));
    await reply;
    return id;
  }
  /** `/s_new` gated on `/n_go`, controls (array controls flattened to their
   *  base-index slots) baked into the spawn. The `/s_new` went out before a
   *  timeout can land, so the catch frees the allocated id — no untracked
   *  drones. */
  async createSynth(
    defName: string,
    targetId: number,
    controls: Record<string, number>,
    arrayControls: ReadonlyArray<{ index: number; values: readonly number[] }> = [],
  ): Promise<number> {
    const id = this.nextNodeId();
    const reply = this.once("/n_go", (n) => n.args.nodeId === id);
    const pairs: Array<[string | number, number]> = Object.entries(controls);
    for (const item of arrayControls)
      item.values.forEach((value, i) => pairs.push([item.index + i, value]));
    this.send(sNew(defName, id, AddToTail, targetId, pairs));
    try {
      await reply;
    } catch (err) {
      this.freeSynth(id);
      throw err;
    }
    return id;
  }

  /** `/d_recv` with an embedded `/sync` completion, gated on its `/synced`
   *  echo — the ack means the def is INSTALLED, so a dependent `/s_new` can
   *  follow immediately. (The sync id spends a node id; harmless, unique.) */
  async sendSynthDef(bytes: Uint8Array): Promise<void> {
    const id = this.nextNodeId();
    const reply = this.once("/synced", (s) => s.args.syncId === id);
    this.send(dRecv(bytes, sync(id)));
    await reply;
  }
  // ── fire-and-forget commands ────────────────────────────────────────────
  // All silently dropped on a dead socket (`send` gates on IS_OPEN): the
  // teardown paths rely on that during a disconnect.

  setControl(id: number, name: string, value: number) {
    this.send(nSet(id, { [name]: value }));
  }
  setControln(id: number, name: string, values: readonly number[]) {
    this.send(nSetn(id, [[name, [...values]]]));
  }
  setNodeRun(id: number, flag: 0 | 1) {
    this.send(nRun([[id, flag]]));
  }
  freeSynth(id: number) {
    this.send(nFree([id]));
  }
  /** Free a group and everything inside it — `/g_freeAll` empties, `/n_free`
   *  removes the group node itself. */
  freeGroup(id: number) {
    this.send(gFreeAll([id]));
    this.send(nFree([id]));
  }
  freeSynthDef(name: string) {
    this.send(dFree([name]));
  }
  subscribeScope(subId: number, scope: number, channels: number, chunkSize: number) {
    this.send(scopeSubscribe(subId, scope, channels, chunkSize));
  }
  unsubscribeScope(subId: number) {
    this.send(scopeUnsubscribe(subId));
  }
  sendDirt(event: Record<string, string | number>, timetag: number) {
    this.sendBundle(atUnixMs(timetag), [dirtPlay(event)]);
  }
  /** Route one typed inbound reply: satisfy at most one waiter, then the
   *  telemetry arms — scope chunks and status stay OUT of the console log
   *  (they stream continuously), everything else lands as an rx entry.
   *  Public on purpose: the unit suites feed replies here directly. */
  handleReply(reply: ServerReply, raw?: { address: string; args: object[] }): void {
    const waiter = this.waiters.find(
      (w) => w.address === reply.address && (w.match as (r: ServerReply) => boolean)(reply),
    );
    if (waiter) {
      this.waiters = this.waiters.filter((w) => w !== waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(reply);
    }
    if (Array.isArray(reply.args)) {
      // Unknown-address fallback: log-only (nothing routes on it).
      this.appendRawReply(reply, raw);
      return;
    }
    if (reply.address === "/scope/chunk") {
      if (reply.args.channels > 0 && reply.args.samples.length % reply.args.channels === 0) {
        this.events.scopeChunk(reply.args.subId, reply.args);
      } else {
        console.error(
          "[osc] bad /scope/chunk:",
          reply.args.channels,
          "channels,",
          reply.args.samples.length,
        );
      }
      return;
    }
    if (reply.address === "/status.reply") {
      this.events.status({
        avgCpu: reply.args.avgCpu,
        peakCpu: reply.args.peakCpu,
        sampleRate: reply.args.actualSampleRate,
        numUgens: reply.args.numUgens,
        numSynths: reply.args.numSynths,
        numGroups: reply.args.numGroups,
      });
      if (this.statusTimer !== null) this.armWatchdog();
      return;
    }
    if (reply.address === "/fail") {
      this.events.banner(reply.args.command, reply.args.error || "(no message)", "error");
    } else if (reply.address === "/late") {
      // Two NTP timetags (scheduled, executed) — the lateness is their
      // difference in seconds.
      const seconds =
        reply.args.lateSecs -
        reply.args.seconds +
        (reply.args.lateFracs - reply.args.fractions) / 2 ** 32;
      this.events.banner("/late", `bundle ran ${seconds.toFixed(3)}s late`, "warn");
    }
    this.appendRawReply(reply, raw);
  }
  private appendRawReply(reply: ServerReply, raw?: { address: string; args: object[] }) {
    // Production always supplies the raw wire view; the unit tests that
    // inject typed replies without bytes log the address alone.
    const values = raw?.args.map((arg) => Object.values(arg)[0]) ?? [];
    this.append("rx", raw?.address ?? reply.address, values.map(formatOscArg));
  }
  /** Log one outbound command from its wire bytes — the same raw decode
   *  the rx side renders with, so the tx log is wire-true by construction. */
  private appendTx(bytes: Uint8Array) {
    for (const d of describeEncoded(bytes)) {
      this.append("tx", d.address, d.args.map(formatOscArg));
    }
  }
  /** Queue one log entry, flushing the batch once per microtask burst —
   *  one `log` event per burst instead of one postMessage per message. */
  private append(dir: "tx" | "rx", address: string, args: string[]) {
    this.logQueue.push({ ts: Date.now(), dir, address, args });
    if (this.logScheduled) return;
    this.logScheduled = true;
    queueMicrotask(() => {
      this.logScheduled = false;
      const entries = this.logQueue;
      this.logQueue = [];
      this.events.log(entries);
    });
  }
  /** The liveness watchdog: the bridge heartbeats scsynth at 1 s and fans
   *  every `/status.reply` to us — re-armed on each one (in handleReply),
   *  so sustained silence means the bridge is gone and the connection
   *  closes loudly. Worker timers keep this honest in backgrounded tabs. */
  private armWatchdog() {
    this.disarmWatchdog();
    this.statusTimer = setTimeout(() => {
      this.statusTimer = null;
      const message = `no /status.reply for ${STATUS_REPLY_TIMEOUT_MS / 1000}s — connection closed`;
      this.events.banner("/status.reply", message, "error");
      this.close();
    }, STATUS_REPLY_TIMEOUT_MS);
  }
  private disarmWatchdog() {
    if (this.statusTimer !== null) {
      clearTimeout(this.statusTimer);
      this.statusTimer = null;
    }
  }
  private transportError(err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    this.openReject?.(error);
    this.openResolve = this.openReject = null;
    this.events.banner("websocket", error.message, "error");
    if (this.transport.status() === TRANSPORT_STATUS.IS_OPEN) this.close();
  }
  private closed(code?: number, reason?: string) {
    this.openReject?.(new Error("websocket closed before open"));
    this.openResolve = this.openReject = null;
    this.disarmWatchdog();
    this.rejectWaiters(new Error("OscClient.once: connection closed"));
    if (code && code !== 1000)
      this.events.banner(
        "websocket",
        `connection closed (${code}${reason ? `: ${reason}` : ""})`,
        "warn",
      );
    this.events.closed(code, reason);
  }
}
