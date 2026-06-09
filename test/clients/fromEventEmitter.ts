// Adapt an EventEmitter-style message source (a node worker_threads `Worker` on
// the main side, or `parentPort` on the worker side) to a MessageEndpoint. The
// dual of src/osc fromEventTarget; lives in the test harness since that's where
// the only EventEmitter-backed workers are. The transfer-list cast (DOM
// Transferable[] → node's list) lives here, once. Callers needing a WorkerHandle
// add `onError`/`terminate`.

import type { MessageEndpoint } from "../../src/osc/messageEndpoint";

/** Structurally typed so both the node `Worker` and `parentPort` satisfy it,
 *  without importing `node:worker_threads`. */
interface MessageEmitter {
  postMessage(message: unknown, transfer?: readonly unknown[]): void;
  on(event: "message", listener: (message: unknown) => void): void;
  off(event: "message", listener: (message: unknown) => void): void;
}

export function fromEventEmitter<Send, Receive>(emitter: MessageEmitter): MessageEndpoint<Send, Receive> {
  return {
    postMessage: (message, transfer = []) => emitter.postMessage(message, transfer),
    onMessage: (handler) => {
      const listener = (message: unknown) => handler(message as Receive);
      emitter.on("message", listener);
      return () => emitter.off("message", listener);
    },
  };
}
