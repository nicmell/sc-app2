// osc-js transport plugin over the WorkerClient (the main-thread proxy to
// the WebSocket-owning worker). A thin adapter: it implements the osc-js
// Plugin contract (OSC calls open/close/send/status) and maps the
// transport's events onto the `notify` callback osc-js registers — osc-js
// does all OSC decode/dispatch from there. All worker/WebSocket mechanics
// live behind the shared OscTransport interface.

import OSC from "osc-js";
import { workerClient } from "@/lib/worker/WorkerClient";
import type { TransportEvent } from "@/types/osc";

/** What `open()` needs: the WebSocket URL of the OSC bridge. */
export interface WebsocketWorkerPluginOptions {
  url?: string;
}

type Notify = (...args: unknown[]) => void;

export class WebsocketWorkerPlugin extends OSC.Plugin {
  private readonly transport = workerClient;
  private notify: Notify = () => {};

  constructor() {
    super();
    this.transport.onMessage((msg) => this.handleMessage(msg));
  }

  /** Called by osc-js after construction to hand us its event sink. */
  registerNotify(fn: Notify): void {
    this.notify = fn;
  }

  /** Connection status — the transport's numbering mirrors `OSC.STATUS`. */
  status(): number {
    return this.transport.status();
  }

  /** Open the WebSocket to `url` (the client spawns its worker lazily —
   *  nothing runs until the first connect). */
  open(customOptions: WebsocketWorkerPluginOptions = {}): void {
    const { url } = customOptions;
    if (!url) throw new Error("WebsocketWorkerPlugin.open: missing url");
    this.transport.open(url);
  }

  /** Close the WebSocket; the client emits the final 'close' event itself. */
  close(): void {
    this.transport.close();
  }

  /** Relay one packed OSC packet over the transport. */
  send(binary: Uint8Array): void {
    this.transport.send(binary);
  }

  /** Map a transport event onto osc-js's notify: inbound frames are unpacked
   *  and dispatched by osc-js (a malformed frame throws inside notify —
   *  surface it instead of crashing); connection events pass through. */
  private handleMessage(msg: TransportEvent): void {
    switch (msg.type) {
      case "message":
        try {
          this.notify(new Uint8Array(msg.data));
        } catch (err) {
          this.notify("error", err);
        }
        return;
      case "error":
        this.notify("error", new Error(msg.message));
        return;
      case "open":
      case "close":
        this.notify(msg.type);
        return;
    }
  }
}
