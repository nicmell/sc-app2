/**
 * Scope-protocol OSC commands.
 *
 * The bridge intercepts `/scope/*` messages in the WebSocket pump and services
 * them through `src-tauri/src/core/scope/`. It emits `/scope/chunk` as a regular
 * OSC reply; the main thread decodes chunk args with `parseScopeChunkArgs`.
 *
 * Wire shape:
 * - `/scope/subscribe`   subId:i, scope:i, channels:i, chunk:i
 * - `/scope/unsubscribe` subId:i
 * - `/scope/chunk`       subId:i, tick:i, isGap:i, channels:i, data:b
 *
 * `data` is a blob (`Uint8Array`) of `frameCount × channels × 4`
 * bytes of **big-endian** IEEE-754 float32, planar — one frame run
 * per channel (the SHM slot's own layout).
 * BE for consistency with OSC's `,f` type.
 */

import type { OscArg, OscMessage } from "../types";

const message = (address: string, ...args: OscArg[]): OscMessage => ({ address, args });

export const SCOPE_SUBSCRIBE_ADDRESS = "/scope/subscribe";
export const SCOPE_UNSUBSCRIBE_ADDRESS = "/scope/unsubscribe";
export const SCOPE_CHUNK_ADDRESS = "/scope/chunk";

export interface ScopeSubscribeParams {
  /** Worker-minted monotonic id; bridge echoes on chunk frames. */
  subId: number;
  /** Scope-buffer index (SHM mode) or bufnum (OSC fallback mode).
   *  Bridge interprets per `Session::scope_mode`. */
  scope: number;
  channels: number;
  chunkSize: number;
}

export const scopeSubscribe = ({
  subId,
  scope,
  channels,
  chunkSize,
}: ScopeSubscribeParams): OscMessage =>
  message(SCOPE_SUBSCRIBE_ADDRESS, subId, scope, channels, chunkSize);

export const scopeUnsubscribe = (subId: number): OscMessage =>
  message(SCOPE_UNSUBSCRIBE_ADDRESS, subId);

export interface DecodedScopeChunk {
  subId: number;
  tickIndex: number;
  isGap: boolean;
  channels: number;
  frameCount: number;
  /** Planar samples (one frame run per channel — the SHM slot's own
   *  layout), `frameCount × channels` floats. Owns its own
   *  `ArrayBuffer` (allocated fresh by the byte-swap loop) so the
   *  worker can transfer it across postMessage. */
  data: Float32Array;
}

/** Parse the args of a decoded `/scope/chunk` reply. The bridge
 *  encodes the data blob with big-endian f32 bytes; we byte-swap
 *  on the way to a `Float32Array` because the codec gives us the raw blob
 *  bytes as a `Uint8Array` (host-native float interpretation
 *  isn't safe). */
export function parseScopeChunkArgs(args: ReadonlyArray<unknown>): DecodedScopeChunk {
  if (args.length < 5) {
    throw new Error(`parseScopeChunkArgs: expected 5 args, got ${args.length}`);
  }
  const subId = expectInt(args[0], "subId");
  const tickIndex = expectInt(args[1], "tickIndex");
  const isGap = expectInt(args[2], "isGap") !== 0;
  const channels = expectInt(args[3], "channels");
  const blob = args[4];
  if (!(blob instanceof Uint8Array)) {
    throw new Error(`parseScopeChunkArgs: data arg is not a Uint8Array (got ${typeof blob})`);
  }
  if (blob.byteLength % 4 !== 0) {
    throw new Error(
      `parseScopeChunkArgs: blob byteLength ${blob.byteLength} is not a multiple of 4`,
    );
  }
  const totalFloats = blob.byteLength / 4;
  if (channels === 0) {
    throw new Error("parseScopeChunkArgs: channels must be > 0");
  }
  if (totalFloats % channels !== 0) {
    throw new Error(
      `parseScopeChunkArgs: totalFloats ${totalFloats} not divisible by channels ${channels}`,
    );
  }
  const frameCount = totalFloats / channels;
  const data = decodeBlobFloatsBE(blob);
  return { subId, tickIndex, isGap, channels, frameCount, data };
}

/** Decode a blob of big-endian f32 bytes into a fresh
 *  `Float32Array`. Cost: one `DataView.getFloat32` per float plus
 *  one alloc; ~376 KB/sec/scope at default config — trivial. */
export function decodeBlobFloatsBE(blob: Uint8Array): Float32Array {
  const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const count = blob.byteLength / 4;
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = dv.getFloat32(i * 4, false); // false = BE
  }
  return out;
}

function expectInt(v: unknown, name: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`${name} must be a finite number, got ${typeof v}`);
  }
  return v | 0;
}
