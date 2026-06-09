// An OscClient backed by a real Node worker_threads worker — the faithful Node
// analogue of the browser WorkerOscClient. Exercises the actual postMessage
// boundary + ArrayBuffer transfer (the scope chunk), catching serialization
// bugs the in-process client can't. The worker runs `nodeWorkerEntry.ts` under
// a tsx loader so it can import the package's TypeScript directly.

import { Worker } from "node:worker_threads";
import { encode, type OscPacket } from "@sc-app/server-commands";
import type { MainToWorker, WorkerToMain } from "../../src/types/protocol";
import type {
  ErrorListener,
  OscClient,
  ReplyListener,
  ScopeChunkListener,
} from "../../src/osc/OscClient";

export class NodeWorkerOscClient implements OscClient {
  private readonly worker: Worker;
  private readonly replyListeners = new Set<ReplyListener>();
  private readonly errorListeners = new Set<ErrorListener>();
  private readonly scopeChunkListeners = new Set<ScopeChunkListener>();

  readonly ready: Promise<void>;

  constructor(url: string) {
    // A plain-JS bootstrap registers tsx's loader, then imports the TS entry —
    // robust across Node versions (vs. relying on an `--import tsx` execArgv).
    this.worker = new Worker(new URL("./nodeWorkerBootstrap.mjs", import.meta.url));

    this.ready = new Promise<void>((resolve, reject) => {
      const onMsg = (msg: WorkerToMain) => {
        if (msg.type === "ready") {
          this.worker.off("message", onMsg);
          resolve();
        } else if (msg.type === "error") {
          this.worker.off("message", onMsg);
          reject(new Error(msg.message));
        }
      };
      this.worker.on("message", onMsg);
      this.worker.on("error", reject);
    });

    this.worker.on("message", (msg: WorkerToMain) => this.handle(msg));
    this.post({ type: "connect", url });
  }

  sendCommand(packet: OscPacket): void {
    this.post({ type: "send", bytes: encode(packet) });
  }

  onReply(cb: ReplyListener): () => void {
    this.replyListeners.add(cb);
    return () => this.replyListeners.delete(cb) as unknown as void;
  }

  onError(cb: ErrorListener): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb) as unknown as void;
  }

  onScopeChunk(cb: ScopeChunkListener): () => void {
    this.scopeChunkListeners.add(cb);
    return () => this.scopeChunkListeners.delete(cb) as unknown as void;
  }

  dispose(): void {
    this.post({ type: "disconnect" });
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
        return;
    }
  }

  private post(msg: MainToWorker): void {
    this.worker.postMessage(msg);
  }
}
