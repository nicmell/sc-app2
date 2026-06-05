// Owns the per-session OSC worker connection and the reactive state the UI
// reads: connection status and a bounded log of OSC traffic (tx + rx). Held as
// a module singleton (see state/session.ts), started once at app boot.

import type { OscArg, OscPacket } from "@sc-app/server-commands";
import { createStore, type ReadonlyStore } from "../util/reactiveStore";
import { WorkerClient } from "../osc/WorkerClient";
import type { OscReply } from "../osc/protocol";
import { IdAllocator } from "../session/IdAllocator";
import { flattenPacket } from "../osc/flatten";
import { ScopeController } from "../scope/ScopeController";
import { bootstrapSession } from "../session/bootstrap";

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

/** scsynth's heartbeat reply: drives the footer, deliberately never logged. */
const STATUS_REPLY = "/status.reply";

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

export class SessionController {
  private readonly statusStore = createStore<ConnStatus>("connecting");
  private readonly logStore = createStore<LoggedEntry[]>([]);
  private readonly scsynthStore = createStore<ScsynthStatus | null>(null);
  private client: WorkerClient | null = null;
  private scopeController: ScopeController | null = null;
  private nextId = 0;
  private disposed = false;

  get status(): ReadonlyStore<ConnStatus> {
    return this.statusStore;
  }

  get log(): ReadonlyStore<LoggedEntry[]> {
    return this.logStore;
  }

  /** scsynth's last reported load (CPU + sample rate), or `null` until the
   *  first `/status.reply` arrives. */
  get scsynthStatus(): ReadonlyStore<ScsynthStatus | null> {
    return this.scsynthStore;
  }

  /** The master-out scope, available once connected. */
  get scope(): ScopeController | null {
    return this.scopeController;
  }

  /** Bootstrap the session, spin up the worker, and wire its events into the
   *  stores. Safe to call once per controller. */
  async start(): Promise<void> {
    try {
      const { wsUrl, sessionGroupId, nodeIdBase, nodeIdCount } = await bootstrapSession();
      if (this.disposed) return;
      const client = new WorkerClient(wsUrl);
      client.onReply((reply) => this.handleReply(reply));
      client.onError(() => {
        if (!this.disposed) this.statusStore.set("error");
      });
      await client.ready;
      if (this.disposed) {
        client.dispose();
        return;
      }
      this.client = client;
      // Synths this session creates live in its server-assigned group, with
      // node ids drawn from its server-assigned block.
      const ids = new IdAllocator(nodeIdBase, nodeIdCount);
      // Start the master-out scope tap + subscription now that we're connected.
      this.scopeController = new ScopeController(client, sessionGroupId, ids);
      this.scopeController.start();
      this.statusStore.set("connected");
    } catch {
      if (!this.disposed) this.statusStore.set("error");
    }
  }

  /** Send an OSC packet over the bridge, logging it as `tx`. */
  send(packet: OscPacket): void {
    if (!this.client) return;
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
    this.client.sendCommand(packet);
  }

  dispose(): void {
    this.disposed = true;
    this.scopeController?.dispose();
    this.scopeController = null;
    this.client?.dispose();
    this.client = null;
  }

  /** Route an inbound reply: `/status.reply` updates the scsynth-status store
   *  (and is kept out of the console); everything else is logged as `rx`. */
  private handleReply(reply: OscReply): void {
    if (reply.address === STATUS_REPLY) {
      this.scsynthStore.set(parseStatus(reply.args));
      return;
    }
    this.append("rx", reply.address, reply.args.map((a) => String(a)));
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.logStore.update((prev) =>
      [...prev, { ts: Date.now(), dir, address, args, id: this.nextId++ }].slice(-MAX_LOG),
    );
  }
}
