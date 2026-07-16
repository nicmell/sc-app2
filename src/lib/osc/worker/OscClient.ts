/** Worker-resident OSC engine: all packet work, sequencing, allocation and watchdog state live here. */
import {
  ADDR_N_GO,
  ADDR_SYNCED,
  AddToTail,
  atDate,
  dFree,
  dRecv,
  decode,
  encode,
  flattenPacket,
  formatOscArg,
  gFreeAll,
  gNewOne,
  isBundle,
  isMessage,
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
  OSC,
  type OscArg,
  type OscPacket,
} from "@sc-app/server-commands";
import { OSC_REPLIES, REPLY_TIMEOUT_MS, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import type { OscLogEntryPayload, OscSession } from "@/types/osc";
import type { ScsynthStatus } from "@/types/stores";
import { TRANSPORT_STATUS, createWsTransport, type WorkerTransport } from "./transport";

interface ReplyWaiter {
  address: string;
  match: (msg: OSC.Message) => boolean;
  resolve: (msg: OSC.Message) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}
export interface OscClientEvents {
  open(): void;
  closed(code?: number, reason?: string): void;
  log(entries: OscLogEntryPayload[]): void;
  banner(address: string, message: string, variant: "error" | "warn"): void;
  status(status: ScsynthStatus): void;
  scopeChunk(subId: number, chunk: ReturnType<typeof parseScopeChunkArgs>): void;
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
        try {
          this.handlePacket(decode(new Uint8Array(event.data)));
        } catch (err) {
          this.transportError(err);
        }
      } else if (event.type === "error") this.transportError(new Error(event.message));
      else this.closed(event.code, event.reason);
    });
  }
  /** Recurse decoded bundles without formatting their typed arguments. */
  private handlePacket(packet: OscPacket): void {
    if (isBundle(packet)) {
      for (const element of packet.bundleElements) this.handlePacket(element as OscPacket);
    } else if (isMessage(packet)) {
      this.handleReply(packet);
    }
  }
  async connect(url: string, session: OscSession): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.openResolve = resolve;
      this.openReject = reject;
      this.transport.open(url);
    });
    this.nextId = session.nodeIdBase;
    this.endId = session.nodeIdBase + session.nodeIdCount;
    this.send(gNewOne(session.sessionGroupId, AddToTail, 0));
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
  send(packet: OscPacket): void {
    if (this.transport.status() !== TRANSPORT_STATUS.IS_OPEN) return;
    for (const msg of flattenPacket(packet)) this.append("tx", msg.address, msg.args);
    this.transport.send(encode(packet));
  }
  once(
    address: string,
    match: (msg: OSC.Message) => boolean = () => true,
    timeoutMs = REPLY_TIMEOUT_MS,
  ): Promise<OSC.Message> {
    return new Promise((resolve, reject) => {
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
    const reply = this.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === id);
    this.send(gNewOne(id, AddToTail, targetId));
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
    const reply = this.once(ADDR_N_GO, (m) => NodeEvent.nodeId(m) === id);
    const pairs: Array<[string | number, number]> = Object.entries(controls);
    for (const item of arrayControls)
      item.values.forEach((value, i) => pairs.push([item.index + i, value]));
    this.send(sNewPairs(defName, id, AddToTail, targetId, pairs));
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
    const reply = this.once(ADDR_SYNCED, (m) => Synced.syncId(m) === id);
    this.send(dRecv(bytes, encode(sync(id))));
    await reply;
  }
  setControl(id: number, name: string, value: number) {
    this.send(nSet(id, { [name]: value }));
  }
  setControln(id: number, name: string, values: readonly number[]) {
    this.send(nSetn(id, [name, values.length, ...values]));
  }
  setNodeRun(id: number, flag: 0 | 1) {
    this.send(nRunOne(id, flag));
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
    const args: Array<string | number> = [];
    for (const [k, v] of Object.entries(event)) args.push(k, v);
    this.send(new OSC.Bundle([new OSC.Message("/dirt/play", ...args)], atDate(timetag)));
  }
  handleReply(reply: OSC.Message): void {
    const waiter = this.waiters.find((w) => w.address === reply.address && w.match(reply));
    if (waiter) {
      this.waiters = this.waiters.filter((w) => w !== waiter);
      clearTimeout(waiter.timer);
      waiter.resolve(reply);
    }
    if (reply.address === SCOPE_CHUNK_ADDRESS) {
      try {
        const chunk = parseScopeChunkArgs(reply.args);
        this.events.scopeChunk(chunk.subId, chunk);
      } catch (err) {
        console.error("[osc] bad /scope/chunk:", err);
      }
      return;
    }
    if (reply.address === OSC_REPLIES.STATUS) {
      const a = reply.args as ReadonlyArray<OscArg>;
      this.events.status({
        avgCpu: Number(a[5]) || 0,
        peakCpu: Number(a[6]) || 0,
        sampleRate: Number(a[8]) || 0,
        numUgens: Number(a[1]) || 0,
        numSynths: Number(a[2]) || 0,
        numGroups: Number(a[3]) || 0,
      });
      if (this.statusTimer !== null) this.armWatchdog();
      return;
    }
    if (reply.address === OSC_REPLIES.FAIL)
      this.events.banner(
        formatOscArg(reply.args[0] ?? "?"),
        formatOscArg(reply.args[1] ?? "(no message)"),
        "error",
      );
    else if (reply.address === OSC_REPLIES.LATE) {
      const seconds = Number(reply.args[0]) || 0;
      this.events.banner("/late", `bundle ran ${seconds.toFixed(3)}s late`, "warn");
    }
    this.append("rx", reply.address, reply.args.map(formatOscArg));
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
      const message = `no ${OSC_REPLIES.STATUS} for ${STATUS_REPLY_TIMEOUT_MS / 1000}s — connection closed`;
      this.events.banner(OSC_REPLIES.STATUS, message, "error");
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
