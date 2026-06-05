// Owns the per-session OSC worker connection and the reactive state the UI
// reads: connection status and a bounded log of OSC traffic (tx + rx). Held as
// a module singleton (see state/session.ts), started once at app boot.

import type { OscPacket } from "@sc-app/server-commands";
import { createStore, type ReadonlyStore } from "../util/reactiveStore";
import { WorkerClient } from "../osc/WorkerClient";
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

/** Max OSC-log entries kept in memory (oldest dropped). */
export const MAX_LOG = 300;

export class SessionController {
  private readonly statusStore = createStore<ConnStatus>("connecting");
  private readonly logStore = createStore<LoggedEntry[]>([]);
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
      client.onReply((reply) =>
        this.append("rx", reply.address, reply.args.map((a) => String(a))),
      );
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

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.logStore.update((prev) =>
      [...prev, { ts: Date.now(), dir, address, args, id: this.nextId++ }].slice(-MAX_LOG),
    );
  }
}
