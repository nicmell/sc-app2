// worker_threads entry (Node): build an OscWorkerPort over `parentPort` and run
// the shared worker runtime — the EventEmitter mirror of the browser worker.ts.
// Spawned by createNodeWorkerClient under a tsx loader (via the .mjs bootstrap)
// so it can import the app's TypeScript directly. No `window` shim needed — in
// Node osc-js finds `global`.

import { parentPort } from "node:worker_threads";
import { runOscWorker } from "../../src/osc/oscWorkerMain";

if (!parentPort) {
  throw new Error("nodeWorkerEntry.ts must run inside a worker_threads Worker");
}
const port = parentPort;

runOscWorker({
  // The only transferred value is a scope chunk's ArrayBuffer, which node's
  // transferList accepts directly (avoids the deprecated TransferListItem type).
  postMessage: (msg, transfer = []) => port.postMessage(msg, transfer as ArrayBuffer[]),
  onMessage: (handler) => {
    port.on("message", handler);
  },
});
