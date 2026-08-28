// Main-thread proxy to the OSC worker. The worker owns the WebSocket and
// codec; this side only posts and receives plain packet data. Production
// uses a SHARED worker — one instance across every same-origin client (tabs
// today; plugin iframes next), each client holding its own MessagePort onto
// the shared endpoint — while the dedicated fallback (no SharedWorker, e.g.
// happy-dom) runs the SAME script as the classic per-page worker. Either
// way this proxy speaks the identical single-client protocol; the sharing
// is entirely the endpoint's business.

import type { OscPacket } from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { composeDispatch, type TransportMiddleware } from "../middleware";
import { TRANSPORT_STATUS, type TransportStatus } from "./transport";

/** Whether this browsing context runs the shared transport (the production
 *  path) — the dedicated fallback keeps today's one-worker-per-page shape. */
export const sharedTransport = typeof SharedWorker !== "undefined";

export class WorkerClient {
  /** The posting seam: a SharedWorker port or the fallback dedicated worker. */
  private target!: MessagePort | Worker;
  private socketStatus: TransportStatus = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
  private notify: (event: TransportEvent) => void = () => {};
  private readonly middlewares: TransportMiddleware[] = [];

  constructor() {
    this.spawn();
    // The shared endpoint can't see a port die (MessagePort has no close
    // event). Two nets, both shared-mode only (the dedicated fallback dies
    // with its page): pagehide covers every ORDERLY end of this document
    // (tab close, navigation, reload, iframe removal); the `attach` lock is
    // the crash net — the browser releases a dead context's Web Locks, and
    // the endpoint treats the release as this port's death.
    if (sharedTransport && typeof window !== "undefined") {
      window.addEventListener("pagehide", () => this.close());
      void this.announce();
    }
  }

  /** Acquire this client's liveness lock, THEN send `attach` — the ordering
   *  guarantees the endpoint's queued lock request can only be granted by
   *  this document's death, never instantly. The lock is held forever (the
   *  callback never resolves); the browser releases it with the document,
   *  crash included. Skipped where Web Locks are unavailable — the port
   *  then simply has no crash net, exactly the pre-liveness behavior. */
  private async announce(): Promise<void> {
    const locks = navigator.locks as LockManager | undefined;
    if (!locks) return;
    const lockName = `sc-osc-${crypto.randomUUID()}`;
    await new Promise<void>((acquired) => {
      void locks.request(lockName, () => {
        acquired();
        return new Promise(() => {}); // hold until page death
      });
    });
    this.dispatchCommand({ type: "attach", lockName });
  }

  open(url: string): void {
    this.socketStatus = TRANSPORT_STATUS.IS_CONNECTING;
    this.dispatchCommand({ type: "open", url });
  }

  /** Leave the shared connection (the socket survives for other clients and
   *  closes with the last one). The orderly close is synthesized here so
   *  THIS client's consumers see exactly one close event — same contract as
   *  the dedicated worker always had. */
  close(): void {
    if (
      this.socketStatus === TRANSPORT_STATUS.IS_NOT_INITIALIZED ||
      this.socketStatus === TRANSPORT_STATUS.IS_CLOSED
    ) {
      return;
    }
    this.dispatchCommand({ type: "close" });
    this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
    this.dispatchEvent({ type: "close" });
  }

  send(packet: OscPacket): void {
    this.dispatchCommand({ type: "osc", packet });
  }

  /** Post a non-OSC protocol command (clock subscribe/unsubscribe) through
   *  the same middleware chain. */
  command(command: TransportCommand): void {
    this.dispatchCommand(command);
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
    if (event.type === "open") this.socketStatus = TRANSPORT_STATUS.IS_OPEN;
    if (event.type === "close") this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
    this.dispatchEvent(event);
  };

  private spawn(): void {
    // Both literal constructions must stay inline for Vite's worker bundling
    // (they statically resolve to the SAME script).
    if (sharedTransport) {
      const shared = new SharedWorker(new URL("./worker.ts", import.meta.url), {
        type: "module",
        name: "sc-osc",
      });
      shared.port.onmessage = this.handleMessage;
      shared.onerror = () => {
        // A wedged SHARED worker can't be respawned per client without
        // stranding its siblings — surface it as a dead connection (a page
        // reload gets a fresh worker once the last holder is gone).
        this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
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
