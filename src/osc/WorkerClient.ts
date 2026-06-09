// Main-thread handle to the OSC worker. Encodes outbound packets, forwards
// them as bytes, and fans decoded inbound replies out to listeners. One client
// owns one worker, which owns one WebSocket — created per session.

import { encode, type OscPacket } from "@sc-app/server-commands";
import type { ErrorListener, OscClient, ReplyListener, ScopeChunkListener } from "./OscClient";
import type { MainToWorker, WorkerToMain } from "../types/protocol";

/** Browser OscClient: spawns the Vite Web Worker (the only bundler-specific
 *  piece) and bridges its postMessages to the controllers' OscClient surface. */
export class WorkerClient implements OscClient {
  private readonly worker: Worker;
  private readonly replyListeners = new Set<ReplyListener>();
  private readonly errorListeners = new Set<ErrorListener>();
  private readonly scopeChunkListeners = new Set<ScopeChunkListener>();

  /** Resolves once the worker's WebSocket is open; rejects if it fails to open. */
  readonly ready: Promise<void>;

  constructor(url: string) {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    this.ready = new Promise<void>((resolve, reject) => {
      let settled = false;
      this.worker.addEventListener("message", (ev: MessageEvent<WorkerToMain>) => {
        const msg = ev.data;
        if (!settled && msg.type === "ready") {
          settled = true;
          resolve();
        } else if (!settled && msg.type === "error") {
          settled = true;
          reject(new Error(msg.message));
        }
      });
    });

    this.worker.addEventListener("message", (ev: MessageEvent<WorkerToMain>) =>
      this.handle(ev.data),
    );

    this.post({ type: "connect", url });
  }

  /** Encode an OSC message/bundle and send it over the bridge. */
  sendCommand(packet: OscPacket): void {
    this.post({ type: "send", bytes: encode(packet) });
  }

  /** Subscribe to decoded inbound OSC messages (bundles arrive flattened). */
  onReply(cb: ReplyListener): () => void {
    this.replyListeners.add(cb);
    return () => this.replyListeners.delete(cb) as unknown as void;
  }

  /** Subscribe to transport/decode errors (and unexpected WS close). */
  onError(cb: ErrorListener): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb) as unknown as void;
  }

  /** Subscribe to decoded `/scope/chunk` frames (the worker transfers each
   *  chunk's Float32Array, so a listener must consume `data` synchronously). */
  onScopeChunk(cb: ScopeChunkListener): () => void {
    this.scopeChunkListeners.add(cb);
    return () => this.scopeChunkListeners.delete(cb) as unknown as void;
  }

  /** Tear down: close the WS and terminate the worker. */
  dispose(): void {
    this.post({ type: "disconnect" });
    this.worker.terminate();
    this.replyListeners.clear();
    this.errorListeners.clear();
    this.scopeChunkListeners.clear();
  }

  private handle(msg: WorkerToMain): void {
    switch (msg.type) {
      case "reply":
        for (const cb of this.replyListeners) cb(msg.reply);
        return;
      case "scopeChunk":
        for (const cb of this.scopeChunkListeners) cb(msg.chunk);
        return;
      case "error":
        for (const cb of this.errorListeners) cb(msg.message);
        return;
      case "closed":
        for (const cb of this.errorListeners) cb("websocket closed");
        return;
      case "ready":
        return; // handled by the `ready` promise
    }
  }

  private post(msg: MainToWorker): void {
    this.worker.postMessage(msg);
  }
}
