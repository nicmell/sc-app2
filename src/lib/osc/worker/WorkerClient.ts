// Main-thread proxy to the OSC worker. The permanent worker owns the
// WebSocket and codec; this side only posts and receives plain packet data.

import type { OscPacket } from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { composeDispatch, type TransportMiddleware } from "../middleware";
import { TRANSPORT_STATUS, type TransportStatus } from "./transport";

export class WorkerClient {
  private worker: Worker;
  private socketStatus: TransportStatus = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
  private notify: (event: TransportEvent) => void = () => {};
  private readonly middlewares: TransportMiddleware[] = [];

  constructor() {
    this.worker = this.spawn();
  }

  open(url: string): void {
    this.socketStatus = TRANSPORT_STATUS.IS_CONNECTING;
    this.dispatchCommand({ type: "open", url });
  }

  /** The worker remains alive for the next connection. The orderly close is
   *  synthesized here so consumers see exactly one close event. */
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

  private spawn(): Worker {
    // The literal construction must stay inline for Vite's worker bundling.
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (ev: MessageEvent<TransportEvent>) => {
      const event = ev.data;
      if (event.type === "open") this.socketStatus = TRANSPORT_STATUS.IS_OPEN;
      if (event.type === "close") this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.dispatchEvent(event);
    };
    worker.onerror = (ev: ErrorEvent) => {
      worker.terminate();
      this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.worker = this.spawn();
      this.dispatchEvent({ type: "respawn" });
      this.dispatchEvent({ type: "error", message: ev.message || "worker error" });
    };
    return worker;
  }

  private post(command: TransportCommand): void {
    this.worker.postMessage(command);
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
