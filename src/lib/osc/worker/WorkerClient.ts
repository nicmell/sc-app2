// Main-thread proxy to the OSC worker. The permanent worker owns the
// WebSocket and codec; this side only posts and receives plain packet data.

import type { OscPacket } from "@sc-app/server-commands";
import type { TransportCommand, TransportEvent } from "@/types/osc";
import { TRANSPORT_STATUS, type TransportStatus } from "./transport";

export class WorkerClient {
  private worker: Worker;
  private socketStatus: TransportStatus = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
  private notify: (event: TransportEvent) => void = () => {};

  constructor() {
    this.worker = this.spawn();
  }

  open(url: string): void {
    this.socketStatus = TRANSPORT_STATUS.IS_CONNECTING;
    this.post({ type: "open", url });
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
    this.post({ type: "close" });
    this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
    this.notify({ type: "close" });
  }

  send(packet: OscPacket): void {
    this.post({ type: "osc", packet });
  }

  onEvent(cb: (event: TransportEvent) => void): void {
    this.notify = cb;
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
      this.notify(event);
    };
    worker.onerror = (ev: ErrorEvent) => {
      worker.terminate();
      this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.worker = this.spawn();
      this.notify({ type: "respawn" });
      this.notify({ type: "error", message: ev.message || "worker error" });
    };
    return worker;
  }

  private post(command: TransportCommand): void {
    this.worker.postMessage(command);
  }
}

export const workerClient = new WorkerClient();
