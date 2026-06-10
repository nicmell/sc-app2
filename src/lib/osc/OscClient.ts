// The app's OSC client: composes osc-js's OSC class with the
// WebsocketWorkerPlugin, so all encode/decode/dispatch is osc-js and the
// WebSocket runs in a Web Worker. The interface mirrors the OSC class
// (open/close/send/on/off/status), plus a promise-returning
// `connect(url, session)`.
//
// One global instance (`oscClient`) serves the whole frontend — the
// SessionManager starts the connection once `POST /api/session` yields the WS
// URL + session block, and consumers (ScopeController, …) subscribe to
// addresses directly. On connect the client creates the session's scsynth group itself
// (`/g_new` at the tail of scsynth's root group — sessions always start
// fresh; the bridge ends them when the WebSocket closes) and owns node-id
// allocation from the session's server-assigned block (`nextNodeId`).

import OSC from "osc-js";
import { AddToTail, gNewOne, type OscPacket } from "@sc-app/server-commands";
import { WebsocketWorkerPlugin } from "./WebsocketWorkerPlugin";
import type { OscSession } from "@/types/osc";

export class OscClient {
  private readonly osc = new OSC({ plugin: new WebsocketWorkerPlugin() });
  /** Next node id to hand out, within `[nodeIdBase, nodeIdEnd)`. */
  private nextId = 0;
  private endId = 0;

  /** Open the WebSocket (via the worker) to `url`; once open, create the
   *  session's group at the tail of scsynth's root group and arm the node-id
   *  allocator over the session's block. Resolves once the socket is open;
   *  rejects on an error or close before that. */
  connect(url: string, session: OscSession): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const offAll = () => {
        this.off("open", onOpen);
        this.off("error", onError);
        this.off("close", onClose);
      };
      const onOpen = this.on("open", () => {
        offAll();
        this.nextId = session.nodeIdBase;
        this.endId = session.nodeIdBase + session.nodeIdCount;
        // The session is freshly minted (it dies with the previous WebSocket),
        // so its group never pre-exists: create it at the tail of scsynth's
        // root group, after SuperDirt's output monitors.
        this.send(gNewOne(session.sessionGroupId, AddToTail, 0));
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

  /** Allocate the next node id from the session's server-assigned block.
   *  Throws before `connect` and if the block is exhausted (a bug — the range
   *  is far larger than any realistic session needs). */
  nextNodeId(): number {
    if (this.endId === 0) throw new Error("OscClient.nextNodeId: not connected");
    if (this.nextId >= this.endId) throw new Error("OscClient.nextNodeId: node-id block exhausted");
    return this.nextId++;
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
