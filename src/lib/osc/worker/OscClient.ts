/** Worker-resident OSC engine: all packet work, sequencing, allocation and watchdog state live here. */
import {
  AddToTail,
  atUnixMs,
  decodeReplyPacket,
  describeReply,
  dFree,
  dirtPlay,
  dRecv,
  encode,
  encodeBundle,
  flattenEncoded,
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
  toScopeChunk,
  type DecodedScopeChunk,
  type OscTime,
  type ServerMessage,
  type ServerReply,
} from "@sc-app/server-commands";
import { REPLY_TIMEOUT_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import type { OscLogEntryPayload, OscSession } from "@/types/osc";
import type { ScsynthStatus } from "@/types/stores";
import { TRANSPORT_STATUS, createWsTransport, type WorkerTransport } from "./transport";

type ReplyTag = ServerReply["tag"];
type ReplyVal<T extends ReplyTag> = Extract<ServerReply, { tag: T }>["val"];

/** A pending `once()` — matched in `handleReply` by reply tag + payload
 *  predicate. Stored type-erased; `once()` is the typed constructor. */
interface ReplyWaiter {
  tag: ReplyTag;
  match: (val: unknown) => boolean;
  resolve: (val: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
export interface OscClientEvents {
  open(): void;
  closed(code?: number, reason?: string): void;
  log(entries: OscLogEntryPayload[]): void;
  banner(address: string, message: string, variant: "error" | "warn"): void;
  status(status: ScsynthStatus): void;
  scopeChunk(subId: number, chunk: DecodedScopeChunk): void;
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
  private logQueue: OscLogEntryPayload[] = [];
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
          for (const reply of decodeReplyPacket(new Uint8Array(event.data))) {
            this.handleReply(reply);
          }
        } catch (err) {
          this.transportError(err);
        }
      } else if (event.type === "error") this.transportError(new Error(event.message));
      else this.closed(event.code, event.reason);
    });
  }
  async connect(url: string, session: OscSession): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.openResolve = resolve;
      this.openReject = reject;
      this.transport.open(url);
    });
    this.nextId = session.nodeIdBase;
    this.endId = session.nodeIdBase + session.nodeIdCount;
    this.send(gNew(session.sessionGroupId, AddToTail, 0));
    this.armWatchdog();
  }
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
  send(msg: ServerMessage): void {
    if (this.transport.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    const bytes = encode(msg);
    this.appendTx(bytes);
    this.transport.send(bytes);
  }
  /** Send several commands as one timetagged bundle — scsynth applies them
   *  atomically at the tag. */
  sendBundle(time: OscTime, msgs: ServerMessage[]): void {
    if (this.transport.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    const bytes = encodeBundle(time, msgs);
    this.appendTx(bytes);
    this.transport.send(bytes);
  }
  once<T extends ReplyTag>(
    tag: T,
    match: (val: ReplyVal<T>) => boolean = () => true,
    timeoutMs = REPLY_TIMEOUT_MS,
  ): Promise<ReplyVal<T>> {
    return new Promise((resolve, reject) => {
      const waiter: ReplyWaiter = {
        tag,
        match: match as (val: unknown) => boolean,
        resolve: resolve as (val: unknown) => void,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          reject(new Error(`OscClient.once: timed out waiting for ${tag}`));
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
  async createGroup(targetId: number): Promise<number> {
    const id = this.nextNodeId();
    const reply = this.once("n-go", (n) => n.nodeId === id);
    this.send(gNew(id, AddToTail, targetId));
    await reply;
    return id;
  }
  async createSynth(
    defName: string,
    targetId: number,
    controls: Record<string, number>,
    arrayControls: ReadonlyArray<{ index: number; values: readonly number[] }> = [],
  ): Promise<number> {
    const id = this.nextNodeId();
    const reply = this.once("n-go", (n) => n.nodeId === id);
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
  async sendSynthDef(bytes: Uint8Array): Promise<void> {
    const id = this.nextNodeId();
    const reply = this.once("synced", (s) => s.syncId === id);
    this.send(dRecv(bytes, encode(sync(id))));
    await reply;
  }
  setControl(id: number, name: string, value: number) {
    this.send(nSet(id, { [name]: value }));
  }
  setControln(id: number, name: string, values: readonly number[]) {
    this.send(nSetn(id, name, values));
  }
  setNodeRun(id: number, flag: 0 | 1) {
    this.send(nRun(id, flag));
  }
  freeSynth(id: number) {
    this.send(nFree(id));
  }
  freeGroup(id: number) {
    this.send(gFreeAll(id));
    this.send(nFree(id));
  }
  freeSynthDef(name: string) {
    this.send(dFree(name));
  }
  subscribeScope(subId: number, scope: number, channels: number, chunkSize: number) {
    this.send(scopeSubscribe({ subId, scope, channels, chunkSize }));
  }
  unsubscribeScope(subId: number) {
    this.send(scopeUnsubscribe(subId));
  }
  sendDirt(event: Record<string, string | number>, timetag: number) {
    this.sendBundle(atUnixMs(timetag), [dirtPlay(event)]);
  }
  handleReply(reply: ServerReply): void {
    const val: unknown = reply.val;
    const waiter = this.waiters.find((w) => w.tag === reply.tag && w.match(val));
    if (waiter) {
      this.waiters = this.waiters.filter((w) => w !== waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(val);
    }
    if (reply.tag === "scope-chunk") {
      try {
        this.events.scopeChunk(reply.val.subId, toScopeChunk(reply.val));
      } catch (err) {
        console.error("[osc] bad /scope/chunk:", err);
      }
      return;
    }
    if (reply.tag === "status-reply") {
      const s = reply.val;
      this.events.status({
        avgCpu: s.avgCpu,
        peakCpu: s.peakCpu,
        sampleRate: s.actualSampleRate,
        numUgens: s.numUgens,
        numSynths: s.numSynths,
        numGroups: s.numGroups,
      });
      if (this.statusTimer !== null) this.armWatchdog();
      return;
    }
    if (reply.tag === "fail") {
      this.events.banner(reply.val.address, reply.val.error || "(no message)", "error");
    } else if (reply.tag === "late") {
      // Two NTP timetags (scheduled, executed) — the lateness is their
      // difference in seconds.
      const l = reply.val;
      const seconds = l.lateSecs - l.seconds + (l.lateFracs - l.fractions) / 2 ** 32;
      this.events.banner("/late", `bundle ran ${seconds.toFixed(3)}s late`, "warn");
    }
    const d = describeReply(reply);
    this.append("rx", d.address, d.args);
  }
  /** Log outbound bytes as sent — decoded back to per-message wire truth
   *  (a bundle logs each contained message). */
  private appendTx(bytes: Uint8Array) {
    for (const m of flattenEncoded(bytes)) {
      this.append("tx", m.address, m.args.map(formatOscArg));
    }
  }
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
