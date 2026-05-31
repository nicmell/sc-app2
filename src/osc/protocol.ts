// Message protocol between the main thread and the OSC worker.
//
// The worker owns the WebSocket and all OSC decode; the main thread encodes
// outbound packets and reads decoded replies. `postMessage` structured-clones
// these, so payloads are plain POJOs (no class instances / methods survive).

import type { OscArg } from "@sc-app/server-commands";

/** One decoded inbound OSC message (a bundle is flattened to these). */
export interface OscReply {
  address: string;
  args: ReadonlyArray<OscArg>;
}

export type MainToWorker =
  | { type: "connect"; url: string }
  | { type: "disconnect" }
  | { type: "send"; bytes: Uint8Array };

export type WorkerToMain =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "reply"; reply: OscReply }
  | { type: "closed" };
