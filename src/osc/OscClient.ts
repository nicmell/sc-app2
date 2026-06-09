// The app's OSC client: composes osc-js's OSC class with the
// WebsocketWorkerPlugin, so all encode/decode/dispatch is osc-js and the
// WebSocket runs in a Web Worker. The interface mirrors the OSC class
// (open/close/send/on/off/status), plus a promise-returning `connect(url)`.
//
// One global instance (`oscClient`) serves the whole frontend — the
// SessionManager starts the connection once the bootstrap yields the WS URL,
// and consumers (ScopeController, …) subscribe to addresses directly.

import OSC from "osc-js";
import type { OscPacket } from "@sc-app/server-commands";
import { WebsocketWorkerPlugin } from "./WebsocketWorkerPlugin";

export class OscClient {
  private readonly osc = new OSC({ plugin: new WebsocketWorkerPlugin() });

  /** Open the WebSocket (via the worker) to `url`. Resolves once the socket is
   *  open; rejects on an error or close before that. */
  connect(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const offAll = () => {
        this.off("open", onOpen);
        this.off("error", onError);
        this.off("close", onClose);
      };
      const onOpen = this.on("open", () => {
        offAll();
        resolve();
      });
      const onError = this.on("error", (err: unknown) => {
        offAll();
        reject(err instanceof Error ? err : new Error(String(err)));
      });
      const onClose = this.on("close", () => {
        offAll();
        reject(new Error("websocket closed before open"));
      });
      this.osc.open({ url });
    });
  }

  /** Close the connection (and the worker behind it). */
  close(): void {
    this.osc.close();
  }

  /** Pack and send an OSC message/bundle over the worker's WebSocket. */
  send(packet: OscPacket): void {
    this.osc.send(packet);
  }

  /** Subscribe to an OSC address pattern (wildcards supported, `*` for every
   *  message) or a connection event ('open' | 'close' | 'error'). Returns a
   *  subscription id for `off`. */
  on(event: string, callback: (...args: any[]) => void): number {
    return this.osc.on(event, callback);
  }

  /** Remove a subscription made with `on`. */
  off(event: string, subscriptionId: number): boolean {
    return this.osc.off(event, subscriptionId);
  }

  /** Connection status (an `OSC.STATUS` value). */
  status(): number {
    return this.osc.status();
  }
}

/** The one OSC client for the whole frontend. The worker/WebSocket only spin
 *  up on the first `connect`, so creating this at import time is free. */
export const oscClient = new OscClient();
