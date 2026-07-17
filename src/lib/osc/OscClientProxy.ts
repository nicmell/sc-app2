// Main-thread façade over the worker-resident OSC engine: every operation
// is one typed protocol message over the worker port — a request/command is
// just `{type: <worker method>, args}` (types/osc.d.ts derives the unions
// from the OscClient signatures, so the generic request()/command() below
// are the whole transport) — while all UI-facing state stays here: the app
// store's `osc` slice (console log, error banners, scsynth status, the
// `connected` signal), the awaited-RPC pending map, the session-group/
// scope-slot bookkeeping, and the scope-chunk subscriber callbacks. The
// split's rule: the WORKER owns protocol facts and time (decode, reply
// waiters, unthrottled timers), the PROXY owns state and presentation. See
// lib/osc/README.md.
//
// Importing the singleton spawns nothing — the worker is created lazily on
// the first operation, and a crash tears it down and rejects every pending
// RPC; the next operation spawns a fresh one.

import { MAX_ERRORS, MAX_LOG, RPC_TIMEOUT_MS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ScopeChunkReply } from "@sc-app/server-commands";
import type { OscCommandMethod, OscEvent, OscRequestMethod, OscSession } from "@/types/osc";
import { workerPort, type ProtocolPort } from "./protocol/port";
import type { OscClient } from "./worker/OscClient";

type EventName = "open" | "close" | "error";
type Pending = {
  resolve(value: unknown): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
};

export class OscClientProxy {
  private readonly state = appStore.slice(SliceName.OSC);
  /** The read-only store views consumers subscribe to. `connected` is the
   *  transport-level "session group exists, allocators armed" signal the
   *  plugin lifecycle arms on — distinct from the session slice's UI status. */
  readonly connected = this.state.select((s) => s.connected);
  readonly log = this.state.select((s) => s.log);
  readonly errors = this.state.select((s) => s.errors);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);
  private port: ProtocolPort | null = null;
  private worker: Worker | null = null;
  /** Awaited RPCs keyed by the proxy-minted request id — settled by the
   *  worker's correlated `reply` event, rejected on a crash, and timed out
   *  loudly so a lost message can never wedge a caller forever. */
  private pending = new Map<number, Pending>();
  private nextRequestId = 1;
  /** The session group id, armed by connect() (throws before it). */
  private groupId: number | null = null;
  // The scope-slot allocator over the session's server-assigned span
  // (scopeIndexBase/Count): one slot per mounted <sc-scope>, recycled
  // through a free list. scopeCount = 0 doubles as "not connected".
  private scopeBase = 0;
  private scopeCount = 0;
  private scopeUsed = 0;
  private freeScopeSlots: number[] = [];
  private nextSubId = 1;
  /** Chunk consumers keyed by the proxy-minted subId (one per <sc-scope>). */
  private scopeChunkSubs = new Map<number, (chunk: ScopeChunkReply) => void>();
  private nextEntryId = 0;
  private nextListenerId = 1;
  private listeners = new Map<EventName, Map<number, (value?: unknown) => void>>();

  /** Swap in an external port (the unit suites' synchronous loopback),
   *  terminating any real worker. */
  attachPort(port: ProtocolPort): void {
    this.worker?.terminate();
    this.worker = null;
    this.bind(port);
  }

  /** Route the worker's event stream: RPC replies settle `pending`, the
   *  telemetry events land in the store, chunks fan out to their subId's
   *  callback. Each case's `args` tuple is typed by the OscClientEvents
   *  signature it mirrors. */
  private bind(port: ProtocolPort) {
    this.port = port;
    port.onMessage((raw) => {
      const m = raw as OscEvent;
      switch (m.type) {
        case "reply": {
          const p = this.pending.get(m.id);
          if (!p) return;
          this.pending.delete(m.id);
          clearTimeout(p.timer);
          if (m.ok) p.resolve(m.result);
          else p.reject(new Error(m.error));
          return;
        }
        case "open":
          this.emit("open");
          return;
        case "closed": {
          const [code, reason] = m.args;
          this.state.update((s) => ({ ...s, connected: false }));
          this.emit("close", { code, reason });
          return;
        }
        case "log": {
          const [entries] = m.args;
          this.state.update((s) => ({
            ...s,
            log: [...s.log, ...entries.map((e) => ({ ...e, id: this.nextEntryId++ }))].slice(
              -MAX_LOG,
            ),
          }));
          return;
        }
        case "banner": {
          const [address, message, variant] = m.args;
          this.pushError(address, message, variant);
          return;
        }
        case "status": {
          const [scsynth] = m.args;
          this.state.update((s) => ({ ...s, scsynthStatus: scsynth }));
          return;
        }
        case "scopeChunk": {
          const [subId, chunk] = m.args;
          this.scopeChunkSubs.get(subId)?.(chunk);
          return;
        }
      }
    });
  }

  /** The lazy-spawn seam every operation goes through. */
  private ensurePort() {
    if (this.port) return this.port;
    return this.spawn();
  }
  /** The literal construction stays here so Vite discovers the worker entry. */
  private spawn(): ProtocolPort {
    const worker = new Worker(new URL("./worker/worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    this.bind(workerPort(worker));
    worker.onerror = (event) => this.workerCrash(event.message || "worker error");
    return this.port!;
  }

  /** Engine failure containment: reject everything in flight and drop the
   *  connection state; the NEXT operation lazy-spawns a replacement (no
   *  eager respawn — a persistently failing worker, e.g. a stale wasm
   *  asset, must not become a crash/spawn loop). */
  private workerCrash(message: string) {
    this.worker?.terminate();
    this.worker = null;
    this.port = null;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(message));
    }
    this.pending.clear();
    this.state.update((s) => ({ ...s, connected: false }));
    this.emit("error", new Error(message));
  }

  /** One awaited worker call: mint the id, park the resolver, post
   *  `{type, id, args}`. The timeout is the backstop that turns a lost
   *  message (a worker init regression, a dead port) into a loud rejection
   *  instead of a forever-pending promise. */
  private request<K extends OscRequestMethod>(
    type: K,
    ...args: Parameters<OscClient[K]>
  ): Promise<unknown> {
    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`OscClientProxy.${type}: no reply from the worker (${RPC_TIMEOUT_MS}ms)`));
      }, RPC_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.ensurePort().postMessage({ type, id, args });
    });
  }

  /** One fire-and-forget worker call: post `{type, args}`. */
  private command<K extends OscCommandMethod>(type: K, ...args: Parameters<OscClient[K]>): void {
    this.ensurePort().postMessage({ type, args });
  }

  /** Open the connection: the RPC resolves once the worker has the socket
   *  open and the session `/g_new` sent — only then are the local group id
   *  and scope allocator armed and `connected` published, so consumers can
   *  treat the signal as "safe to allocate and send". */
  async connect(url: string, session: OscSession): Promise<void> {
    this.state.update((s) => ({ ...s, scsynthStatus: null, errors: [] }));
    await this.request("connect", url, session);
    this.groupId = session.sessionGroupId;
    this.scopeBase = session.scopeIndexBase;
    this.scopeCount = session.scopeIndexCount;
    this.scopeUsed = 0;
    this.freeScopeSlots = [];
    this.nextSubId = 1;
    this.scopeChunkSubs.clear();
    this.state.update((s) => ({ ...s, connected: true }));
  }

  /** Orderly disconnect (reload/session end) — flips `connected` first so
   *  subscribers unload before the socket dies under them. */
  close(): void {
    this.state.update((s) => ({ ...s, connected: false }));
    if (this.port) this.command("close");
  }

  /** The session group all plugin groups target (loud before connect —
   *  a send without it would target group 0). */
  get sessionGroupId() {
    if (this.groupId === null) throw new Error("OscClient.sessionGroupId: not connected");
    return this.groupId;
  }

  /** Claim one scope slot from the session's span — recycled slots first,
   *  loud when the span is exhausted (8 per session) or not connected. */
  allocScopeIndex() {
    if (this.scopeCount === 0) throw new Error("OscClient.allocScopeIndex: not connected");
    const recycled = this.freeScopeSlots.pop();
    if (recycled !== undefined) return recycled;
    if (this.scopeUsed >= this.scopeCount)
      throw new Error(
        `OscClient.allocScopeIndex: scope-slot block exhausted (${this.scopeCount} per session)`,
      );
    return this.scopeBase + this.scopeUsed++;
  }
  /** Return a slot to the free list. Silently ignores out-of-span indices —
   *  a stale free after a reconnect (new span) must not poison the list. */
  freeScopeIndex(index: number) {
    if (index < this.scopeBase || index >= this.scopeBase + this.scopeCount) return;
    if (!this.freeScopeSlots.includes(index)) this.freeScopeSlots.push(index);
  }

  // ── the scsynth command surface (the elements' whole OSC vocabulary) ────
  // Awaited creations return the worker-allocated node id; the writes and
  // frees are fire-and-forget (silently dropped by the worker on a dead
  // socket — teardown during a disconnect relies on that).

  createGroup(targetId: number): Promise<number> {
    return this.request("createGroup", targetId) as Promise<number>;
  }
  createSynth(
    defName: string,
    targetId: number,
    controls: Record<string, number>,
    arrayControls: ReadonlyArray<{ index: number; values: readonly number[] }> = [],
  ): Promise<number> {
    return this.request(
      "createSynth",
      defName,
      targetId,
      controls,
      arrayControls,
    ) as Promise<number>;
  }
  sendSynthDef(bytes: Uint8Array): Promise<void> {
    return this.request("sendSynthDef", bytes) as Promise<void>;
  }
  setControl(id: number, name: string, value: number) {
    this.command("setControl", id, name, value);
  }
  setControln(id: number, name: string, values: readonly number[]) {
    this.command("setControln", id, name, values);
  }
  setNodeRun(id: number, flag: 0 | 1) {
    this.command("setNodeRun", id, flag);
  }
  freeSynth(id: number) {
    this.command("freeSynth", id);
  }
  freeGroup(id: number) {
    this.command("freeGroup", id);
  }
  freeSynthDef(name: string) {
    this.command("freeSynthDef", name);
  }
  sendDirt(event: Record<string, string | number>, timetag: number) {
    this.command("sendDirt", event, timetag);
  }

  /** Register a scope-slot stream: mints the subId the bridge echoes on
   *  every chunk, wires the callback, and returns the `off()` disposer the
   *  element holds through its unload. */
  subscribeScope(
    scope: number,
    channels: number,
    chunkSize: number,
    onChunk: (chunk: ScopeChunkReply) => void,
  ) {
    const subId = this.nextSubId++;
    this.scopeChunkSubs.set(subId, onChunk);
    this.command("subscribeScope", subId, scope, channels, chunkSize);
    return {
      subId,
      off: () => {
        if (this.scopeChunkSubs.delete(subId)) this.command("unsubscribeScope", subId);
      },
    };
  }

  // Connection-lifecycle listeners (the SessionManager observes close/error
  // to flip the UI status) — id-keyed so callers can detach exactly theirs.
  on(event: EventName, cb: (value?: unknown) => void) {
    const id = this.nextListenerId++;
    let map = this.listeners.get(event);
    if (!map) {
      map = new Map();
      this.listeners.set(event, map);
    }
    map.set(id, cb);
    return id;
  }
  off(event: EventName, id: number) {
    return this.listeners.get(event)?.delete(id) ?? false;
  }
  private emit(event: EventName, value?: unknown) {
    for (const cb of this.listeners.get(event)?.values() ?? []) cb(value);
  }
  dismissError(id: number) {
    this.state.update((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) }));
  }
  clearErrors() {
    this.state.update((s) => ({ ...s, errors: [] }));
  }
  /** Banner + browser-console mirror (the worker has no visible console of
   *  its own worth relying on — every failure stays visible here). */
  private pushError(address: string, message: string, variant: "error" | "warn") {
    (variant === "error" ? console.error : console.warn)(`[osc] ${address}: ${message}`);
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
}
export const oscClient = new OscClientProxy();
export const attachPort = (port: ProtocolPort) => oscClient.attachPort(port);
