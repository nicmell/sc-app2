// Owns the per-session OSC connection and the UI-facing reactive state:
// connection status, a bounded OSC log (tx + rx), scsynth load, and error
// banners. Talks to the bridge through the global `oscClient`; the session
// bootstrap is injected via SessionDeps.
//
// State lives in the single app store (`src/state/store.ts`) under its `session`
// slice; the public `status`/`log`/`scsynthStatus`/`scsynthErrors` are `select`
// views off that slice, so each notifies independently and the React hooks read
// them via useSyncExternalStore.

import OSC from "osc-js";
import {
  flattenPacket,
  SCOPE_CHUNK_ADDRESS,
  type OscArg,
  type OscPacket,
} from "@sc-app/server-commands";
import { oscClient } from "../osc/OscClient";
import { ScopeController, type ScopeOptions } from "../scope/ScopeController";
import { IdAllocator } from "./IdAllocator";
import type { Bootstrap } from "./bootstrapTypes";
import { appStore } from "../state/store";

/** What SessionManager needs from its environment. */
export interface SessionDeps {
  /** Mint/reuse a session and return its connection info. */
  bootstrap: Bootstrap;
  /** Scope diagnostics (the app maps localStorage flags to these). */
  scopeOptions?: ScopeOptions;
}

export type ConnStatus = "connecting" | "connected" | "error";

/** One decoded OSC message for the console. */
export interface OscLogEntry {
  ts: number; // client wall-clock ms
  dir: "tx" | "rx"; // tx = we sent it, rx = we received it
  address: string;
  args: string[];
}

/** A log entry plus a stable React key. */
export type LoggedEntry = OscLogEntry & { id: number };

/** scsynth's live load, parsed from its `/status.reply` heartbeat — what the
 *  footer reports. The Rust bridge polls `/status` and fans the reply out to us. */
export interface ScsynthStatus {
  avgCpu: number;
  peakCpu: number;
  sampleRate: number;
}

/** A scsynth command failure (`/fail`) or late-bundle warning (`/late`),
 *  surfaced to the user as a toast banner. Repeated identical failures coalesce
 *  into one entry with a bumped `count`. */
export interface ScsynthError {
  id: number;
  /** The failed command address (e.g. `/s_new`) — empty for `/late`. */
  address: string;
  message: string;
  variant: "error" | "warn";
  count: number;
  ts: number;
}

/** The session slice of the app store. */
export interface SessionState {
  status: ConnStatus;
  log: LoggedEntry[];
  scsynthStatus: ScsynthStatus | null;
  errors: ScsynthError[];
}

/** Initial session slice, shared with the app store's root state. */
export const initialSessionState: SessionState = {
  status: "connecting",
  log: [],
  scsynthStatus: null,
  errors: [],
};

/** scsynth's heartbeat reply: drives the footer, deliberately never logged. */
const STATUS_REPLY = "/status.reply";

/** Max coalesced error banners kept (oldest dropped). */
const MAX_ERRORS = 20;

/** Parse a `/status.reply`'s args. Layout (scsynth):
 *  `[1, ugens, synths, groups, defs, avgCpu, peakCpu, srNominal, srActual]`. */
function parseStatus(args: ReadonlyArray<OscArg>): ScsynthStatus {
  return {
    avgCpu: Number(args[5]) || 0,
    peakCpu: Number(args[6]) || 0,
    sampleRate: Number(args[8]) || 0,
  };
}

/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

export class SessionManager {
  /** This session's slice of the single app store. */
  private readonly state = appStore.slice("session");
  readonly status = this.state.select((s) => s.status);
  readonly log = this.state.select((s) => s.log);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);
  readonly scsynthErrors = this.state.select((s) => s.errors);

  private readonly deps: SessionDeps;
  private connected = false;
  /** (event, id) pairs of our oscClient subscriptions, for dispose(). */
  private subscriptions: Array<[string, number]> = [];
  private scopeController: ScopeController | null = null;
  private nextId = 0;
  private disposed = false;

  constructor(deps: SessionDeps) {
    this.deps = deps;
  }

  /** Dismiss one banner by id (the toast's × / auto-dismiss timer). */
  dismissError(id: number): void {
    this.state.update((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) }));
  }

  /** Drop every banner. */
  clearErrors(): void {
    this.state.update((s) => ({ ...s, errors: [] }));
  }

  /** The master-out scope, available once connected. */
  get scope(): ScopeController | null {
    return this.scopeController;
  }

  /** Bootstrap the session, connect the global OSC client, and wire its events
   *  into the store. Safe to call once per controller. */
  async start(): Promise<void> {
    try {
      const { wsUrl, sessionGroupId, nodeIdBase, nodeIdCount, scopeIndex } = await this.deps.bootstrap();
      if (this.disposed) return;
      await oscClient.connect(wsUrl);
      if (this.disposed) {
        oscClient.close();
        return;
      }
      this.connected = true;
      this.subscribe("*", (msg: OSC.Message) => this.handleReply(msg));
      // A transport error or an unexpected close both surface as "error".
      this.subscribe("error", () => {
        if (!this.disposed) this.setStatus("error");
      });
      this.subscribe("close", () => {
        if (!this.disposed) this.setStatus("error");
      });
      // Synths this session creates live in its server-assigned group, with
      // node ids drawn from its server-assigned block.
      const ids = new IdAllocator(nodeIdBase, nodeIdCount);
      // Start the master-out scope tap + subscription now that we're connected.
      this.scopeController = new ScopeController(oscClient, sessionGroupId, ids, scopeIndex, this.deps.scopeOptions);
      this.scopeController.start();
      this.setStatus("connected");
    } catch {
      if (!this.disposed) this.setStatus("error");
    }
  }

  /** Send an OSC packet over the bridge, logging it as `tx`. */
  send(packet: OscPacket): void {
    if (!this.connected) return;
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
    oscClient.send(packet);
  }

  dispose(): void {
    this.disposed = true;
    this.scopeController?.dispose();
    this.scopeController = null;
    // Drop our subscriptions before closing so the intentional close doesn't
    // read as an error.
    for (const [event, id] of this.subscriptions) oscClient.off(event, id);
    this.subscriptions = [];
    if (this.connected) {
      this.connected = false;
      oscClient.close();
    }
  }

  private subscribe(event: string, cb: (...args: any[]) => void): void {
    this.subscriptions.push([event, oscClient.on(event, cb)]);
  }

  private setStatus(status: ConnStatus): void {
    this.state.update((s) => ({ ...s, status }));
  }

  /** Route an inbound reply: `/status.reply` updates the scsynth-status slice
   *  (and is kept out of the console); `/scope/chunk` streams at ~47 Hz and is
   *  consumed by the ScopeController's own subscription, so it's skipped here;
   *  `/fail` and `/late` additionally raise a banner; everything else is
   *  logged as `rx`. */
  private handleReply(reply: OSC.Message): void {
    if (reply.address === SCOPE_CHUNK_ADDRESS) return;
    if (reply.address === STATUS_REPLY) {
      const next = parseStatus(reply.args as ReadonlyArray<OscArg>);
      this.state.update((s) => ({ ...s, scsynthStatus: next }));
      return;
    }
    // `/fail <command> <error> [extras…]` and `/late <seconds>` are mirrored to
    // the browser console so every failure is visible there, and also raise a
    // toast banner. Either way they still fall through to the OSC console as
    // the full history.
    if (reply.address === "/fail") {
      const command = String(reply.args[0] ?? "?");
      const message = String(reply.args[1] ?? "(no message)");
      console.error(`[scsynth] ${command}: ${message}`);
      this.pushError(command, message, "error");
    } else if (reply.address === "/late") {
      const seconds = Number(reply.args[0]) || 0;
      const message = `bundle ran ${seconds.toFixed(3)}s late`;
      console.warn(`[scsynth] /late: ${message}`);
      this.pushError("/late", message, "warn");
    }
    this.append("rx", reply.address, reply.args.map((a) => String(a)));
  }

  /** Add a banner, coalescing an identical (address + message) one into a
   *  bumped count + refreshed timestamp (which restarts its auto-dismiss). */
  private pushError(address: string, message: string, variant: "error" | "warn"): void {
    this.state.update((s) => {
      const existing = s.errors.find((e) => e.address === address && e.message === message);
      const errors = existing
        ? s.errors.map((e) => (e === existing ? { ...e, count: e.count + 1, ts: Date.now() } : e))
        : [...s.errors, { id: this.nextId++, address, message, variant, count: 1, ts: Date.now() }].slice(
            -MAX_ERRORS,
          );
      return { ...s, errors };
    });
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.state.update((s) => ({
      ...s,
      log: [...s.log, { ts: Date.now(), dir, address, args, id: this.nextId++ }].slice(-MAX_LOG),
    }));
  }
}
