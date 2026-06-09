// worker_threads entry (Node): build a MessageEndpoint over `parentPort` and run
// the shared worker runtime — the EventEmitter mirror of the browser worker.ts.
// Spawned by createNodeWorkerClient under a tsx loader (via the .mjs bootstrap)
// so it can import the app's TypeScript directly. No `window` shim needed — in
// Node osc-js finds `global`.

import { parentPort } from "node:worker_threads";
import { runOscWorker } from "../../src/osc/oscWorkerMain";
import { fromEventEmitter } from "../../src/osc/messageEndpoint";
import type { MainToWorker, WorkerToMain } from "../../src/types/protocol";

if (!parentPort) {
  throw new Error("nodeWorkerEntry.ts must run inside a worker_threads Worker");
}

runOscWorker(fromEventEmitter<WorkerToMain, MainToWorker>(parentPort));
