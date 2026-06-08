// worker_threads entry: the Node analogue of the browser `worker.ts`. Bridges
// `parentPort` postMessages ↔ the shared bridge core, transferring each scope
// chunk's ArrayBuffer — so the real serialization/transfer path is exercised.
// Spawned by NodeWorkerOscClient with a tsx loader so it can import this TS.

import { parentPort } from "node:worker_threads";
import { createOscBridge, type OscBridge } from "../osc/bridge";
import type { MainToWorker, WorkerToMain } from "../osc/protocol";

if (!parentPort) {
  throw new Error("nodeWorkerEntry.ts must run inside a worker_threads Worker");
}
const port = parentPort;

let bridge: OscBridge | null = null;

function post(msg: WorkerToMain, transfer: ArrayBuffer[] = []): void {
  port.postMessage(msg, transfer);
}

port.on("message", async (msg: MainToWorker) => {
  switch (msg.type) {
    case "connect": {
      bridge = createOscBridge(msg.url, {
        onReply: (reply) => post({ type: "reply", reply }),
        onScopeChunk: (chunk) => post({ type: "scopeChunk", chunk }, [chunk.data.buffer]),
        onError: (message) => post({ type: "error", message }),
        onClose: () => post({ type: "closed" }),
      });
      try {
        await bridge.ready;
        post({ type: "ready" });
      } catch (err) {
        post({ type: "error", message: err instanceof Error ? err.message : String(err) });
      }
      return;
    }
    case "send":
      bridge?.send(msg.bytes);
      return;
    case "disconnect":
      if (bridge) {
        await bridge.close();
        bridge = null;
      }
      return;
  }
});
