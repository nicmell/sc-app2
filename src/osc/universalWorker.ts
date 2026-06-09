// A minimal worker handle that hides the EventTarget-vs-EventEmitter asymmetry
// between a browser `Worker` and a Node `worker_threads` Worker, so the worker
// client (WorkerOscClient) can be written once. Each environment supplies an
// inline implementation of this interface in its `create…WorkerClient` factory
// (BrowserWorker-style in WorkerOscClient.ts; Node-style in the test harness).

export type Unsubscribe = () => void;

export interface UniversalWorker<Out = unknown, In = unknown> {
  postMessage(message: Out, transfer?: Transferable[]): void;
  /** Subscribe to messages (data already unwrapped). Returns an unsubscribe. */
  onMessage(handler: (data: In) => void): Unsubscribe;
  /** Subscribe to worker-level errors. Returns an unsubscribe. */
  onError(handler: (error: Error) => void): Unsubscribe;
  terminate(): Promise<void>;
}
