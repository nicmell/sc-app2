// Node-only OSC clients (import worker_threads / run the bridge in-process).
// Kept out of the main entry so the browser bundle never pulls in node:* APIs.
export { InProcessOscClient } from "./client/InProcessOscClient";
export { NodeWorkerOscClient } from "./client/NodeWorkerOscClient";
