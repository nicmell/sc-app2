// Main-thread handle to the OSC worker, written once for every environment.
// Encodes outbound packets, forwards them as bytes, and fans decoded inbound
// replies out to listeners. The worker is reached through a WorkerHandle, so the
// browser and Node sides differ only in a ~10-line inline implementation (see
// createBrowserWorkerClient below / createNodeWorkerClient in the test harness).
// One client owns one worker, which owns one WebSocket.

import { encode, type DecodedScopeChunk, type OscPacket } from "@sc-app/server-commands";
import type { ErrorListener, OscClient, ReplyListener, ScopeChunkListener } from "./OscClient";
import type { MainToWorker, OscReply, WorkerToMain } from "../types/protocol";
import { fromEventTarget, type WorkerHandle, type Unsubscribe } from "./messageEndpoint";
import { listenerGroup } from "./listenerGroup";

export class WorkerOscClient implements OscClient {
  private readonly worker: WorkerHandle<MainToWorker, WorkerToMain>;
  private readonly replies = listenerGroup<OscReply>();
  private readonly errors = listenerGroup<string>();
  private readonly scopeChunks = listenerGroup<DecodedScopeChunk>();
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
          this.errors.emit(err.message);
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
    return this.replies.add(cb);
  }

  /** Subscribe to transport/decode errors (and unexpected WS close). */
  onError(cb: ErrorListener): () => void {
    return this.errors.add(cb);
  }

  /** Subscribe to decoded `/scope/chunk` frames (the worker transfers each
   *  chunk's Float32Array, so a listener must consume `data` synchronously). */
  onScopeChunk(cb: ScopeChunkListener): () => void {
    return this.scopeChunks.add(cb);
  }

  /** Tear down: close the WS, drop worker listeners, and terminate the worker. */
  dispose(): void {
    this.post({ type: "disconnect" });
    for (const off of this.offs) off();
    this.offs.length = 0;
    void this.worker.terminate();
    this.replies.clear();
    this.errors.clear();
    this.scopeChunks.clear();
  }

  private handle(msg: WorkerToMain): void {
    switch (msg.type) {
      case "reply":
        this.replies.emit(msg.reply);
        return;
      case "scopeChunk":
        this.scopeChunks.emit(msg.chunk);
        return;
      case "error":
        this.errors.emit(msg.message);
        return;
      case "closed":
        this.errors.emit("websocket closed");
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
    ...fromEventTarget<MainToWorker, WorkerToMain>(w),
    onError: (h) => {
      const l = (e: ErrorEvent) => h(e.error ?? new Error(e.message));
      w.addEventListener("error", l);
      return () => w.removeEventListener("error", l);
    },
    terminate: async () => w.terminate(),
  });
}
