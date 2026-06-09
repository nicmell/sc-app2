// The environment-agnostic OSC bridge: owns one WebSocket (via the WHATWG
// `WebSocket`-based transport, which runs in a browser Worker AND in Node 22)
// and all OSC decode. Inbound `/scope/chunk` is parsed into a fresh
// Float32Array; everything else is flattened to `OscReply`s. Both the browser
// Web Worker entry and the Node clients wrap this — identical logic everywhere.

import {
  decode,
  flattenPacket,
  isMessage,
  parseScopeChunkArgs,
  SCOPE_CHUNK_ADDRESS,
  type DecodedScopeChunk,
} from "@sc-app/server-commands";
import { createOscTransport } from "./transport";
import type { OscReply } from "../types/protocol";

export interface OscBridgeCallbacks {
  onReply(reply: OscReply): void;
  onScopeChunk(chunk: DecodedScopeChunk): void;
  onError(message: string): void;
  onClose(): void;
}

export interface OscBridge {
  /** Resolves when the socket opens; rejects if it fails to open. */
  readonly ready: Promise<void>;
  /** Send one binary OSC frame. */
  send(bytes: Uint8Array): void;
  /** Close the socket. */
  close(): Promise<void>;
}

/** Decode one inbound frame and dispatch it via the callbacks. */
function handleInbound(bytes: Uint8Array, cb: OscBridgeCallbacks): void {
  try {
    const packet = decode(bytes);
    if (isMessage(packet) && packet.address === SCOPE_CHUNK_ADDRESS) {
      cb.onScopeChunk(parseScopeChunkArgs(packet.args as unknown[]));
      return;
    }
    for (const reply of flattenPacket(packet)) {
      cb.onReply(reply);
    }
  } catch (err) {
    cb.onError(`decode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Open the bridge WebSocket and wire decode → callbacks. */
export function createOscBridge(url: string, cb: OscBridgeCallbacks): OscBridge {
  const transport = createOscTransport(url);
  transport.onMessage((bytes) => handleInbound(bytes, cb));
  transport.onError(() => cb.onError("websocket error"));
  transport.onClose(() => cb.onClose());
  return {
    ready: transport.ready,
    send: (bytes) => transport.send(bytes),
    close: () => transport.close(),
  };
}
