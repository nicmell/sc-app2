// The main-thread proxy to the WebSocket worker: the same `WorkerTransport`
// interface as the in-worker transport (transport.ts), implemented by
// relaying the postMessage protocol (types/osc.d.ts) to the one worker it
// spawns in its constructor — the worker is permanent; connections come and
// go over it via open/close commands, and a crashed worker is replaced with
// a fresh one on the spot. Status is tracked here from the transport's
// events — it can't be queried synchronously across the thread boundary.

import { TRANSPORT_STATUS, type WorkerTransport, type TransportStatus } from "./transport";
import type { TransportCommand, TransportEvent } from "@/types/osc";

export class WorkerClient implements WorkerTransport {
  private worker: Worker;
  private socketStatus: TransportStatus = TRANSPORT_STATUS.IS_NOT_INITIALIZED;
  private notify: (msg: TransportEvent) => void = () => {};

  constructor() {
    this.worker = this.spawn();
  }

  /** Open the socket to `url`. A previous connection is replaced silently
   *  (the transport disposes it without a close event — that would look like
   *  the new connection failing). */
  open(url: string): void {
    this.socketStatus = TRANSPORT_STATUS.IS_CONNECTING;
    this.post({ type: "open", url });
  }

  /** Close the socket (the worker stays for the next open). Emits the final
   *  `close` event itself — the transport's orderly close is silent, so this
   *  is the single close signal and a stale one can never arrive later, after
   *  a new connection's subscribers are in place. No-op when not connected. */
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

  /** Relay one packed OSC frame, transferring the buffer (fresh per pack()). */
  send(data: Uint8Array): void {
    this.post({ type: "send", data }, [data.buffer]);
  }

  onEvent(cb: (msg: TransportEvent) => void): void {
    this.notify = cb;
  }

  status(): TransportStatus {
    return this.socketStatus;
  }

  /** Spawn and wire a worker. Also the recovery path: if the worker itself
   *  breaks (a script error — distinct from a socket error, which arrives as
   *  a transport event), whatever connection lived in it is gone and nothing
   *  more will come out of it. Replace it FIRST, so the reactive close the
   *  error triggers upstream (OscClient closes on critical errors) lands in
   *  a healthy worker, then surface the error. */
  private spawn(): Worker {
    // The literal `new Worker(new URL(...))` must stay inline so Vite bundles it.
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (ev: MessageEvent<TransportEvent>) => {
      const msg = ev.data;
      if (msg.type === "open") this.socketStatus = TRANSPORT_STATUS.IS_OPEN;
      if (msg.type === "close") this.socketStatus = TRANSPORT_STATUS.IS_CLOSED;
      this.notify(msg);
    };
    worker.onerror = (ev: ErrorEvent) => {
      worker.terminate();
      this.worker = this.spawn();
      this.notify({ type: "error", message: ev.message || "worker error" });
    };
    return worker;
  }

  private post(msg: TransportCommand, transfer?: Transferable[]): void {
    this.worker.postMessage(msg, { transfer });
  }
}

/** The one worker client for the whole frontend — the worker behind it is
 *  spawned right here, at import time; the WebSocket only opens on the first
 *  `open`. */
export const workerClient = new WorkerClient();
