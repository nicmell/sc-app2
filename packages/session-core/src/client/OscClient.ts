// The transport seam the controllers depend on — the public surface of the OSC
// worker, abstracted so it can be backed by a browser Web Worker (the app's
// WorkerOscClient), an in-process bridge (InProcessOscClient), or a Node
// worker_threads worker (NodeWorkerOscClient). The controllers never know which.

import type { DecodedScopeChunk, OscPacket } from "@sc-app/server-commands";
import type { OscReply } from "../osc/protocol";

export type ReplyListener = (reply: OscReply) => void;
export type ErrorListener = (message: string) => void;
export type ScopeChunkListener = (chunk: DecodedScopeChunk) => void;

export interface OscClient {
  /** Resolves once the underlying WebSocket is open; rejects if it fails. */
  readonly ready: Promise<void>;
  /** Encode an OSC packet and send it over the bridge. */
  sendCommand(packet: OscPacket): void;
  /** Subscribe to decoded inbound OSC messages (bundles arrive flattened). */
  onReply(cb: ReplyListener): () => void;
  /** Subscribe to transport/decode errors (and unexpected WS close). */
  onError(cb: ErrorListener): () => void;
  /** Subscribe to decoded `/scope/chunk` frames. */
  onScopeChunk(cb: ScopeChunkListener): () => void;
  /** Tear down the transport. */
  dispose(): void;
}

/** Factory the app's SessionManager is constructed with — the app passes a
 *  WorkerOscClient factory; Node tests pass an in-process / worker_threads one. */
export type OscClientFactory = (wsUrl: string) => OscClient;
