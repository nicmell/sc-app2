// The raw byte-transport protocol between the main thread and the worker. The
// worker is a generic relay — it knows nothing about OSC; it connects/sends/
// receives bytes. All OSC encode/decode lives on the main thread (in the
// OscClient + decodeFrame). `postMessage` structured-clones these, so payloads
// are plain POJOs.

export type MainToWorker =
  | { type: "connect"; url: string }
  | { type: "disconnect" }
  | { type: "send"; bytes: Uint8Array };

export type WorkerToMain =
  | { type: "open" }
  | { type: "message"; bytes: Uint8Array }
  | { type: "error"; message: string }
  | { type: "closed" };
