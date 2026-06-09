// Main-thread handle to the OSC worker, written once for every environment. It
// owns the OSC protocol: sends connect/disconnect, encodes outbound packets, and
// decodes inbound frames (decodeFrame) — the worker itself is a dumb byte relay.
// The worker is reached through a WorkerHandle, so the browser and Node sides
// differ only in a ~10-line inline implementation (see createBrowserWorkerClient
// below / createNodeWorkerClient in the test harness).

import { encode, type DecodedScopeChunk, type OscPacket } from "@sc-app/server-commands";
import type { ErrorListener, OscClient, ReplyListener, ScopeChunkListener } from "./OscClient";
import type { MainToWorker, WorkerToMain } from "../types/protocol";
import { decodeFrame, type OscReply } from "./decodeFrame";
import { fromEventTarget, type WorkerHandle, type Unsubscribe } from "./messageEndpoint";
import { listenerGroup } from "./listenerGroup";

export class WorkerOscClient implements OscClient {
  private readonly wsUrl: string;
  private readonly worker: WorkerHandle<MainToWorker, WorkerToMain>;
  private readonly replies = listenerGroup<OscReply>();
  private readonly errors = listenerGroup<string>();
  private readonly scopeChunks = listenerGroup<DecodedScopeChunk>();
  private readonly offs: Unsubscribe[] = [];

  /** Resolves once the worker's WebSocket is open; rejects if it fails to open. */
  readonly ready: Promise<void>;

  constructor(wsUrl: string, worker: WorkerHandle<MainToWorker, WorkerToMain>) {
    this.wsUrl = wsUrl;
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
          if (msg.type === "open") settle(resolve);
          else if (msg.type === "error") settle(() => reject(new Error(msg.message)));
          this.handle(msg);
        }),
        // A worker-level error before "open" fails the connection too.
        worker.onError((err) => {
          settle(() => reject(err));
          this.errors.emit(err.message);
        }),
      );
    });

    this.connect();
  }

  /** Encode an OSC message/bundle and send it over the transport. */
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

  /** Subscribe to decoded `/scope/chunk` frames. */
  onScopeChunk(cb: ScopeChunkListener): () => void {
    return this.scopeChunks.add(cb);
  }

  /** Tear down: close the WS, drop worker listeners, and terminate the worker. */
  dispose(): void {
    this.disconnect();
    for (const off of this.offs) off();
    this.offs.length = 0;
    void this.worker.terminate();
    this.replies.clear();
    this.errors.clear();
    this.scopeChunks.clear();
  }

  /** Tell the worker to open the WebSocket. */
  private connect(): void {
    this.post({ type: "connect", url: this.wsUrl });
  }

  /** Tell the worker to close the WebSocket. */
  private disconnect(): void {
    this.post({ type: "disconnect" });
  }

  private handle(msg: WorkerToMain): void {
    switch (msg.type) {
      case "message": {
        // Decode raw frames here (the worker is OSC-unaware): /scope/chunk → a
        // Float32Array, everything else → flattened replies.
        try {
          const frame = decodeFrame(msg.bytes);
          if (frame.kind === "scope") this.scopeChunks.emit(frame.chunk);
          else for (const reply of frame.replies) this.replies.emit(reply);
        } catch (err) {
          this.errors.emit(`decode failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }
      case "error":
        this.errors.emit(msg.message);
        return;
      case "closed":
        this.errors.emit("websocket closed");
        return;
      case "open":
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
