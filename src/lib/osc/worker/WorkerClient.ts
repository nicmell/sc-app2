// Main-thread proxy to the OSC worker. The worker owns the WebSocket and
// codec; this side only posts and receives plain packet data. Production
// uses a SHARED worker — one instance across the dashboard, its box iframes,
// and popped-out tabs, each holding one MessagePort (docs/multi-tab.md); the
// dedicated-worker fallback (no SharedWorker — e.g. happy-dom) runs the SAME
// script over the classic per-page worker. Membership (join/leave) and the
// correlated side-band RPCs live here; raw OSC stays fire-and-forget.

import type { OscPacket } from "@sc-app/server-commands";
import type {
  OscSession,
  RpcRequest,
  RpcResult,
  TransportCommand,
  TransportEvent,
} from "@/types/osc";
import { composeDispatch, type TransportMiddleware } from "../middleware";
import { TRANSPORT_STATUS, type TransportStatus } from "./transport";

interface PendingRpc {
  resolve: (result: RpcResult) => void;
  reject: (err: Error) => void;
}

export class WorkerClient {
  /** The posting seam: a SharedWorker port or the fallback dedicated worker. */
  private target!: MessagePort | Worker;
  private socketStatus: TransportStatus = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
  private notify: (event: TransportEvent) => void = () => {};
  private readonly middlewares: TransportMiddleware[] = [];
  private readonly pendingRpc = new Map<number, PendingRpc>();
  private nextRpcId = 1;

  constructor() {
    this.spawn();
  }

  /** Join `sessionId`'s shared connection (the first member opens the
   *  socket; later members attach). `lockName` is the Web Lock this client
   *  holds — the worker treats its release as this client's death. */
  join(url: string, sessionId: string, session: OscSession, lockName?: string): void {
    this.socketStatus = TRANSPORT_STATUS.IS_CONNECTING;
    this.dispatchCommand({ type: "join", url, sessionId, session, lockName });
  }

  /** Leave the shared connection — the socket itself survives for the other
   *  members (and a grace window past the last one). The orderly close is
   *  synthesized here so THIS client's consumers see exactly one close. */
  close(): void {
    if (
      this.socketStatus === TRANSPORT_STATUS.IS_NOT_INITIALIZED ||
      this.socketStatus === TRANSPORT_STATUS.IS_CLOSED
    ) {
      return;
    }
    this.dispatchCommand({ type: "leave" });
    this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
    this.failRpcs(new Error("WorkerClient: left the session"));
    this.dispatchEvent({ type: "close" });
  }

  send(packet: OscPacket): void {
    this.dispatchCommand({ type: "osc", packet });
  }

  /** One correlated side-band request (allocation, box claims, presets).
   *  Resolves with the worker's RpcResult; rejects on leave/crash. */
  request(req: RpcRequest): Promise<RpcResult> {
    const id = this.nextRpcId++;
    return new Promise<RpcResult>((resolve, reject) => {
      this.pendingRpc.set(id, { resolve, reject });
      this.dispatchCommand({ type: "rpc", id, req });
    });
  }

  onEvent(cb: (event: TransportEvent) => void): void {
    this.notify = cb;
  }

  use(middleware: TransportMiddleware): () => void {
    if (this.middlewares.includes(middleware)) {
      throw new Error("WorkerClient.use: middleware already registered");
    }
    this.middlewares.push(middleware);
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index !== -1) this.middlewares.splice(index, 1);
    };
  }

  status(): TransportStatus {
    return this.socketStatus;
  }

  private handleMessage = (ev: MessageEvent<TransportEvent>): void => {
    const event = ev.data;
    if (event.type === "rpc-reply") {
      const pending = this.pendingRpc.get(event.id);
      this.pendingRpc.delete(event.id);
      pending?.resolve(event.result);
      return;
    }
    if (event.type === "open") this.socketStatus = TRANSPORT_STATUS.IS_OPEN;
    if (event.type === "close") {
      this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.failRpcs(new Error("WorkerClient: connection closed"));
    }
    this.dispatchEvent(event);
  };

  private failRpcs(err: Error): void {
    const pending = [...this.pendingRpc.values()];
    this.pendingRpc.clear();
    for (const p of pending) p.reject(err);
  }

  private spawn(): void {
    // Both literal constructions must stay inline for Vite's worker bundling
    // (they statically resolve to the SAME script).
    if (typeof SharedWorker !== "undefined") {
      const shared = new SharedWorker(new URL("./worker.ts", import.meta.url), {
        type: "module",
        name: "sc-osc",
      });
      shared.port.onmessage = this.handleMessage;
      shared.onerror = () => {
        // A wedged SHARED worker can't be respawned per client without
        // stranding the others — treat it as a dead connection (a page
        // reload gets a fresh worker once the last holder is gone).
        this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
        this.failRpcs(new Error("WorkerClient: shared worker error"));
        this.dispatchEvent({ type: "error", message: "shared worker error" });
        this.dispatchEvent({ type: "close", reason: "shared worker error" });
      };
      shared.port.start();
      this.target = shared.port;
      return;
    }
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = this.handleMessage;
    worker.onerror = (ev: ErrorEvent) => {
      worker.terminate();
      this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.failRpcs(new Error("WorkerClient: worker crashed"));
      this.spawn();
      this.dispatchEvent({ type: "respawn" });
      this.dispatchEvent({ type: "error", message: ev.message || "worker error" });
      this.dispatchEvent({ type: "close", reason: "worker crashed" });
    };
    this.target = worker;
  }

  private post(command: TransportCommand): void {
    this.target.postMessage(command);
  }

  private dispatchCommand(command: TransportCommand): void {
    composeDispatch(
      this.middlewares.map((middleware) => middleware.command?.bind(middleware)),
      (next) => this.post(next),
    )(command);
  }

  private dispatchEvent(event: TransportEvent): void {
    composeDispatch(
      this.middlewares.map((middleware) => middleware.event?.bind(middleware)),
      (next) => this.notify(next),
    )(event);
  }
}

export const workerClient = new WorkerClient();
