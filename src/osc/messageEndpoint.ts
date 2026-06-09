// Tiny channel interfaces that hide the EventTarget-vs-EventEmitter asymmetry
// between a browser `Worker` and a Node `worker_threads` Worker, so the worker
// client + worker runtime are each written once. `fromEventTarget` (here) and
// `fromEventEmitter` (test harness) adapt the two kinds of source; call sites add
// `onError`/`terminate` when they need a full WorkerHandle.

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

/** An EventTarget-style message source — both a browser `Worker` (main thread)
 *  and `self` (DedicatedWorkerGlobalScope) satisfy it. */
interface MessageTarget {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (ev: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (ev: MessageEvent) => void): void;
}

/** Adapt an EventTarget-style source to a MessageEndpoint (unwraps
 *  `MessageEvent.data`). Callers needing a WorkerHandle add `onError`/`terminate`. */
export function fromEventTarget<Send, Receive>(target: MessageTarget): MessageEndpoint<Send, Receive> {
  return {
    postMessage: (message, transfer = []) => target.postMessage(message, transfer),
    onMessage: (handler) => {
      const listener = (ev: MessageEvent) => handler(ev.data as Receive);
      target.addEventListener("message", listener);
      return () => target.removeEventListener("message", listener);
    },
  };
}
