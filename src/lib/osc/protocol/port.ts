// The two-method port abstraction the protocol rides on. It papers over the
// minor API difference between a `Worker` handle (main side) and the
// `DedicatedWorkerGlobalScope` (worker side) — and it IS the test seam: the
// unit suites swap in a synchronous in-memory pair
// (lib/utils/test/loopback.ts) so both halves run in one happy-dom process,
// and worker.ts wraps the global port to buffer across the wasm
// top-level-await window.

export interface ProtocolPort {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  /** Install THE message handler — single-consumer, a later call replaces
   *  the previous one (mirrors `onmessage` assignment). */
  onMessage(cb: (msg: unknown) => void): void;
}

/** The main-thread side of a spawned worker. */
export const workerPort = (worker: Worker): ProtocolPort => ({
  postMessage: (msg, transfer) => worker.postMessage(msg, { transfer }),
  onMessage: (cb) => {
    worker.onmessage = (event) => cb(event.data);
  },
});

/** The worker-global side (the production entry's scope). */
export const workerGlobalPort = (scope: DedicatedWorkerGlobalScope): ProtocolPort => ({
  postMessage: (msg, transfer) => scope.postMessage(msg, { transfer }),
  onMessage: (cb) => {
    scope.onmessage = (event) => cb(event.data);
  },
});
