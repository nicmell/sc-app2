// worker_threads entry (Node): build a MessageEndpoint over `parentPort` and run
// the shared transport relay — the EventEmitter mirror of the browser worker.ts.
// Spawned by createNodeWorkerClient under a tsx loader (via the .mjs bootstrap)
// so it can import the app's TypeScript directly.

import { parentPort } from "node:worker_threads";
import { runTransportWorker } from "../../src/worker/transportWorker";
import { fromEventEmitter } from "../../src/worker/messageEndpoint";
import type { MainToWorker, WorkerToMain } from "../../src/worker/protocol";

if (!parentPort) {
  throw new Error("nodeWorkerEntry.ts must run inside a worker_threads Worker");
}

runTransportWorker(fromEventEmitter<WorkerToMain, MainToWorker>(parentPort));
