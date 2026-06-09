// Tiny channel interfaces that hide the EventTarget-vs-EventEmitter asymmetry
// between a browser `Worker` and a Node `worker_threads` Worker, so the worker
// client + worker runtime are each written once. Each environment supplies an
// inline implementation at its call site (see createBrowserWorkerClient /
// createNodeWorkerClient, and the worker.ts / nodeWorkerEntry.ts entries).

export type Unsubscribe = () => void;

/** A typed bidirectional message channel. `Send` = what this end posts,
 *  `Receive` = what it gets back. */
export interface MessageEndpoint<Send, Receive> {
  postMessage(message: Send, transfer?: Transferable[]): void;
  /** Subscribe to inbound messages (data already unwrapped). Returns an unsubscribe. */
  onMessage(handler: (message: Receive) => void): Unsubscribe;
}

/** The main thread's handle to a worker: a channel it can also watch for
 *  failures and shut down. */
export interface WorkerHandle<Send, Receive> extends MessageEndpoint<Send, Receive> {
  /** Subscribe to worker-level errors. Returns an unsubscribe. */
  onError(handler: (error: Error) => void): Unsubscribe;
  terminate(): Promise<void>;
}
