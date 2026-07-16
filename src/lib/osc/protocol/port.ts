export interface ProtocolPort {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  onMessage(cb: (msg: unknown) => void): void;
}

export const workerPort = (worker: Worker): ProtocolPort => ({
  postMessage: (msg, transfer) => worker.postMessage(msg, { transfer }),
  onMessage: (cb) => {
    worker.onmessage = (event) => cb(event.data);
  },
});

export const workerGlobalPort = (scope: DedicatedWorkerGlobalScope): ProtocolPort => ({
  postMessage: (msg, transfer) => scope.postMessage(msg, { transfer }),
  onMessage: (cb) => {
    scope.onmessage = (event) => cb(event.data);
  },
});
