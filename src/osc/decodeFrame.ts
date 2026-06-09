// Decode one inbound OSC frame (raw bytes off the transport) on the main thread.
// `/scope/chunk` is parsed into a fresh Float32Array; everything else is flattened
// to per-message replies. The OscClient calls this on each `message` from the
// worker — the worker itself is OSC-unaware.

import {
  decode,
  flattenPacket,
  isMessage,
  parseScopeChunkArgs,
  SCOPE_CHUNK_ADDRESS,
  type DecodedScopeChunk,
  type OscArg,
} from "@sc-app/server-commands";

/** One decoded inbound OSC message (a bundle is flattened to these). */
export interface OscReply {
  address: string;
  args: ReadonlyArray<OscArg>;
}

export type DecodedFrame =
  | { kind: "scope"; chunk: DecodedScopeChunk }
  | { kind: "replies"; replies: OscReply[] };

/** Decode one binary OSC frame. Throws on malformed bytes (the caller surfaces it). */
export function decodeFrame(bytes: Uint8Array): DecodedFrame {
  const packet = decode(bytes);
  if (isMessage(packet) && packet.address === SCOPE_CHUNK_ADDRESS) {
    return { kind: "scope", chunk: parseScopeChunkArgs(packet.args as unknown[]) };
  }
  return { kind: "replies", replies: flattenPacket(packet) };
}
