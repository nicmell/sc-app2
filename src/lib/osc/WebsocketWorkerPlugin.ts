// osc-js transport plugin that runs the WebSocket in a Web Worker (worker.ts),
// keeping socket traffic off the main thread. Implements the osc-js Plugin
// contract: OSC calls open/close/send/status; the plugin reports inbound frames
// and connection events through the `notify` callback osc-js registers, and
// osc-js does all OSC decode/dispatch from there.

import OSC from "osc-js";
import type { PluginToWorker, WorkerToPlugin } from "./protocol";

/** What `open()` needs: the WebSocket URL of the OSC bridge. */
export interface WebsocketWorkerPluginOptions {
  url?: string;
}

type Notify = (...args: unknown[]) => void;

export class WebsocketWorkerPlugin extends OSC.Plugin {
  private worker: Worker | null = null;
  private socketStatus: number = OSC.STATUS.IS_NOT_INITIALIZED;
  private notify: Notify = () => {};

  /** Called by osc-js after construction to hand us its event sink. */
  registerNotify(fn: Notify): void {
    this.notify = fn;
  }

  status(): number {
    return this.socketStatus;
  }

  /** Spawn the worker (lazily — nothing runs until the first connect) and open
   *  the WebSocket to `url`. */
  open(customOptions: WebsocketWorkerPluginOptions = {}): void {
    const { url } = customOptions;
    if (!url) throw new Error("WebsocketWorkerPlugin.open: missing url");
    // Silently replace a previous worker (no 'close' notify — that would look
    // like the new connection failing).
    this.worker?.terminate();
    this.worker = null;

    // The literal `new Worker(new URL(...))` must stay inline so Vite bundles it.
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    this.socketStatus = OSC.STATUS.IS_CONNECTING;

    worker.onmessage = (ev: MessageEvent<WorkerToPlugin>) => {
      const msg = ev.data;
      switch (msg.type) {
        case "open":
          this.socketStatus = OSC.STATUS.IS_OPEN;
          this.notify("open");
          return;
        case "message":
          // osc-js unpacks the binary and dispatches by address. A malformed
          // frame throws inside notify — surface it instead of crashing.
          try {
            this.notify(new Uint8Array(msg.data));
          } catch (err) {
            this.notify("error", err);
          }
          return;
        case "error":
          this.notify("error", new Error(msg.message));
          return;
        case "close":
          this.socketStatus = OSC.STATUS.IS_CLOSED;
          this.notify("close");
          return;
      }
    };
    worker.onerror = (ev: ErrorEvent) => {
      this.notify("error", ev.error ?? new Error(ev.message));
    };

    this.post({ type: "open", url });
  }

  /** Close the WebSocket and terminate the worker; a later open() respawns it.
   *  Termination also tears the socket down, so notify 'close' from here — the
   *  worker's own close relay won't outlive it. */
  close(): void {
    if (!this.worker) return;
    this.socketStatus = OSC.STATUS.IS_CLOSING;
    this.post({ type: "close" });
    this.worker.terminate();
    this.worker = null;
    this.socketStatus = OSC.STATUS.IS_CLOSED;
    this.notify("close");
  }

  /** Relay one packed OSC packet, transferring the buffer (fresh per pack()). */
  send(binary: Uint8Array): void {
    this.post({ type: "send", data: binary }, [binary.buffer as ArrayBuffer]);
  }

  private post(msg: PluginToWorker, transfer?: Transferable[]): void {
    this.worker?.postMessage(msg, { transfer });
  }
}
