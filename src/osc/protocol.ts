// The message protocol between the WebsocketWorkerPlugin (main thread) and the
// WebSocket-owning worker. Pure bytes — all OSC encode/decode happens in osc-js
// on the main thread; the worker only moves frames.

export type PluginToWorker =
  | { type: "open"; url: string }
  | { type: "send"; data: Uint8Array }
  | { type: "close" };

export type WorkerToPlugin =
  | { type: "open" }
  | { type: "message"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "close" };
