// The app's OSC client: composes osc-js's OSC class with the
// WebsocketWorkerPlugin, so all encode/decode/dispatch is osc-js and the
// WebSocket runs in a Web Worker. The interface mirrors the OSC class
// (open/close/send/on/off/status), plus a promise-returning
// `connect(url, session)`.
//
// One global instance (`oscClient`) serves the whole frontend — the
// SessionManager starts the connection once `POST /api/session` yields the WS
// URL + session block, and consumers (ScopeController, …) subscribe to
// addresses directly. On connect the client creates the session's scsynth group itself
// (`/g_new` at the tail of scsynth's root group — sessions always start
// fresh; the bridge ends them when the WebSocket closes) and owns node-id
// allocation from the session's server-assigned block (`nextNodeId`).
//
// The client also owns the whole OSC telemetry domain — the `osc` slice of the
// app store: the bounded tx/rx console log, the `/fail`–`/late` error banners,
// scsynth's `/status.reply` load, and the transport-level `connected` signal
// consumers arm on (the ScopeController starts/stops with it). And it polices
// its own connection: a critical transport error or a missed `/status.reply`
// heartbeat terminates the session by closing the WebSocket — the
// SessionManager only observes the close.

import OSC from "osc-js";
import {
  AddToTail,
  flattenPacket,
  formatOscArg,
  gNewOne,
  SCOPE_CHUNK_ADDRESS,
  type OscArg,
  type OscPacket,
} from "@sc-app/server-commands";
import { MAX_ERRORS, MAX_LOG, OSC_REPLIES, STATUS_REPLY_TIMEOUT_MS } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import { WebsocketWorkerPlugin } from "./WebsocketWorkerPlugin";
import type { OscSession } from "@/types/osc";
import type { ScsynthStatus } from "@/types/stores";

/** Parse a `/status.reply`'s args. Layout (scsynth):
 *  `[1, ugens, synths, groups, defs, avgCpu, peakCpu, srNominal, srActual]`. */
function parseStatus(args: ReadonlyArray<OscArg>): ScsynthStatus {
  return {
    avgCpu: Number(args[5]) || 0,
    peakCpu: Number(args[6]) || 0,
    sampleRate: Number(args[8]) || 0,
  };
}

export class OscClient {
  private readonly osc = new OSC({ plugin: new WebsocketWorkerPlugin() });

  /** The OSC slice of the single app store. */
  private readonly state = appStore.slice(SliceName.OSC);
  /** Transport-level "connection ready": the session group exists and the
   *  node-id allocator is armed. The ScopeController starts/stops on it. */
  readonly connected = this.state.select((s) => s.connected);
  readonly log = this.state.select((s) => s.log);
  readonly errors = this.state.select((s) => s.errors);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);

  /** Next node id to hand out, within `[nodeIdBase, nodeIdEnd)`. */
  private nextId = 0;
  private endId = 0;
  private groupId: number | null = null;
  private sessionScopeIndex: number | null = null;
  /** Stable React keys for log entries and banners. */
  private nextEntryId = 0;
  /** The `/status.reply` heartbeat watchdog (armed while connected). */
  private statusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Always-on subscriptions (osc-js handlers survive reconnects; nothing
    // here spawns the worker — that only happens in connect()).
    this.osc.on("*", (msg: OSC.Message) => this.handleReply(msg));
    // A transport error is critical: surface it, then terminate the session
    // by closing — the bridge frees the session group on WS close. Pre-open
    // failures belong to connect()'s promise, so only close an open socket.
    this.osc.on("error", (err: unknown) => {
      console.error("[osc] transport error:", err);
      this.pushError("websocket", err instanceof Error ? err.message : String(err), "error");
      if (this.status() === OSC.STATUS.IS_OPEN) this.close();
    });
  }

  /** Open the WebSocket (via the worker) to `url`; once open, create the
   *  session's group at the tail of scsynth's root group, arm the node-id
   *  allocator over the session's block, and flag `connected` (which arms the
   *  ScopeController and the status watchdog). Resolves once the socket is
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
        this.sessionScopeIndex = session.scopeIndex;
        // The session is freshly minted (it dies with the previous WebSocket),
        // so its group never pre-exists: create it at the tail of scsynth's
        // root group, after SuperDirt's output monitors.
        this.send(gNewOne(session.sessionGroupId, AddToTail, 0));
        // Flag readiness only after /g_new, so subscribers (ScopeController)
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
      this.osc.open({ url });
    });
  }

  /** The session's scsynth group (created on connect) — plugin groups and
   *  synths nest inside it. Throws before `connect`. */
  get sessionGroupId(): number {
    if (this.groupId === null) throw new Error("OscClient.sessionGroupId: not connected");
    return this.groupId;
  }

  /** The session's scsynth scope-buffer index (server-assigned, arrives with
   *  the session block on connect). Throws before `connect`. */
  get scopeIndex(): number {
    if (this.sessionScopeIndex === null) throw new Error("OscClient.scopeIndex: not connected");
    return this.sessionScopeIndex;
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
   *  first lets subscribers (ScopeController) send their teardown while the
   *  socket is still open — harmlessly dropped when the transport is already
   *  dead, since the bridge frees the whole session group on WS close. */
  close(): void {
    this.disarmWatchdog();
    this.state.update((s) => ({ ...s, connected: false }));
    this.osc.close();
  }

  /** Pack and send an OSC message/bundle over the worker's WebSocket, logging
   *  each flattened message as `tx`. Dropped (unlogged) while not open. */
  send(packet: OscPacket): void {
    if (this.status() !== OSC.STATUS.IS_OPEN) return;
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
    this.osc.send(packet);
  }

  /** Subscribe to an OSC address pattern (wildcards supported, `*` for every
   *  message) or a connection event ('open' | 'close' | 'error'). Returns a
   *  subscription id for `off`. */
  on(event: string, callback: (...args: any[]) => void): number {
    return this.osc.on(event, callback);
  }

  /** Remove a subscription made with `on`. */
  off(event: string, subscriptionId: number): boolean {
    return this.osc.off(event, subscriptionId);
  }

  /** Connection status (an `OSC.STATUS` value). */
  status(): number {
    return this.osc.status();
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
   *  streams at ~47 Hz and is consumed by the ScopeController's own
   *  subscription, so only the console log skips it; `/fail` and `/late`
   *  additionally raise a banner; everything else is logged as `rx`.
   *  Public for unit tests — normally fed by the constructor's `*`
   *  subscription. */
  handleReply(reply: OSC.Message): void {
    if (reply.address === SCOPE_CHUNK_ADDRESS) return;
    if (reply.address === OSC_REPLIES.STATUS) {
      const next = parseStatus(reply.args as ReadonlyArray<OscArg>);
      this.state.update((s) => ({ ...s, scsynthStatus: next }));
      // The heartbeat arrived — push the watchdog deadline out again.
      if (this.statusTimer !== null) this.armWatchdog();
      return;
    }
    // `/fail <command> <error> [extras…]` and `/late <seconds>` are mirrored to
    // the browser console so every failure is visible there, and also raise a
    // toast banner. Either way they still fall through to the OSC console as
    // the full history.
    if (reply.address === OSC_REPLIES.FAIL) {
      const command = String(reply.args[0] ?? "?");
      const message = String(reply.args[1] ?? "(no message)");
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

  /** (Re)arm the heartbeat watchdog: if no `/status.reply` lands within the
   *  timeout, the connection is considered dead and gets terminated. */
  private armWatchdog(): void {
    this.disarmWatchdog();
    this.statusTimer = setTimeout(() => {
      this.statusTimer = null;
      const message = `no ${OSC_REPLIES.STATUS} for ${STATUS_REPLY_TIMEOUT_MS / 1000}s — connection closed`;
      console.error(`[osc] ${message}`);
      this.pushError(OSC_REPLIES.STATUS, message, "error");
      this.close();
    }, STATUS_REPLY_TIMEOUT_MS);
  }

  private disarmWatchdog(): void {
    if (this.statusTimer !== null) {
      clearTimeout(this.statusTimer);
      this.statusTimer = null;
    }
  }

  /** Add a banner, coalescing an identical (address + message) one into a
   *  bumped count + refreshed timestamp (which restarts its auto-dismiss). */
  private pushError(address: string, message: string, variant: "error" | "warn"): void {
    this.state.update((s) => {
      const existing = s.errors.find((e) => e.address === address && e.message === message);
      const errors = existing
        ? s.errors.map((e) => (e === existing ? { ...e, count: e.count + 1, ts: Date.now() } : e))
        : [...s.errors, { id: this.nextEntryId++, address, message, variant, count: 1, ts: Date.now() }].slice(
            -MAX_ERRORS,
          );
      return { ...s, errors };
    });
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.state.update((s) => ({
      ...s,
      log: [...s.log, { ts: Date.now(), dir, address, args, id: this.nextEntryId++ }].slice(-MAX_LOG),
    }));
  }
}

/** The one OSC client for the whole frontend. The WebSocket only opens on the
 *  first `connect` (the permanent worker behind it is spawned by the
 *  WorkerClient module at import). */
export const oscClient = new OscClient();
