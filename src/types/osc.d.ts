// OSC transport types: the client-facing session block and the message
// protocol between the WebsocketWorkerPlugin (main thread) and the
// WebSocket-owning worker. Pure bytes on the wire — all OSC encode/decode
// happens in osc-js on the main thread; the worker only moves frames. The ws
// URL isn't a message: it rides in as the worker's `name`, and the worker
// opens the socket on `open`.

/** A session's scsynth allocation, as `OscClient.connect` consumes it. */
export interface OscSession {
  /** The session's group — created by `connect` at the tail of scsynth's root group. */
  sessionGroupId: number;
  /** First node id this session may allocate. */
  nodeIdBase: number;
  /** How many node ids this session may allocate. */
  nodeIdCount: number;
}

export type PluginToWorker =
  | { type: "open"; url: string }
  | { type: "send"; data: Uint8Array }
  | { type: "close" };

export type WorkerToPlugin =
  | { type: "open" }
  | { type: "message"; data: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "close" };
