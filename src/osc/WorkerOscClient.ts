// Main-thread handle to the OSC worker, written once for every environment.
// Encodes outbound packets, forwards them as bytes, and fans decoded inbound
// replies out to listeners. The worker is reached through a WorkerHandle, so the
// browser and Node sides differ only in a ~10-line inline implementation (see
// createBrowserWorkerClient below / createNodeWorkerClient in the test harness).
// One client owns one worker, which owns one WebSocket.

import { encode, type OscPacket } from "@sc-app/server-commands";
import type { ErrorListener, OscClient, ReplyListener, ScopeChunkListener } from "./OscClient";
import type { MainToWorker, WorkerToMain } from "../types/protocol";
import type { WorkerHandle, Unsubscribe } from "./messageEndpoint";

export class WorkerOscClient implements OscClient {
  private readonly worker: WorkerHandle<MainToWorker, WorkerToMain>;
  private readonly replyListeners = new Set<ReplyListener>();
  private readonly errorListeners = new Set<ErrorListener>();
  private readonly scopeChunkListeners = new Set<ScopeChunkListener>();
  private readonly offs: Unsubscribe[] = [];

  /** Resolves once the worker's WebSocket is open; rejects if it fails to open. */
  readonly ready: Promise<void>;

  constructor(wsUrl: string, worker: WorkerHandle<MainToWorker, WorkerToMain>) {
    this.worker = worker;

    this.ready = new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };
      this.offs.push(
        worker.onMessage((msg) => {
          if (msg.type === "ready") settle(resolve);
          else if (msg.type === "error") settle(() => reject(new Error(msg.message)));
          this.handle(msg);
        }),
        // A worker-level error before "ready" fails the connection too.
        worker.onError((err) => {
          settle(() => reject(err));
          for (const cb of this.errorListeners) cb(err.message);
        }),
      );
    });

    this.post({ type: "connect", url: wsUrl });
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

  /** Tear down: close the WS, drop worker listeners, and terminate the worker. */
  dispose(): void {
    this.post({ type: "disconnect" });
    for (const off of this.offs) off();
    this.offs.length = 0;
    void this.worker.terminate();
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

/** Browser OscClient: spawns the Vite Web Worker (the literal `new Worker(new
 *  URL(...))` must stay here so Vite bundles it) behind an inline WorkerHandle
 *  that unwraps `MessageEvent.data`. */
export function createBrowserWorkerClient(wsUrl: string): WorkerOscClient {
  const w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  return new WorkerOscClient(wsUrl, {
    postMessage: (m, t = []) => w.postMessage(m, t),
    onMessage: (h) => {
      const l = (e: MessageEvent) => h(e.data as WorkerToMain);
      w.addEventListener("message", l);
      return () => w.removeEventListener("message", l);
    },
    onError: (h) => {
      const l = (e: ErrorEvent) => h(e.error ?? new Error(e.message));
      w.addEventListener("error", l);
      return () => w.removeEventListener("error", l);
    },
    terminate: async () => w.terminate(),
  });
}
