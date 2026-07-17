/**
 * The app-facing scope-chunk shape. Decoding (address dispatch, blob
 * byte-swap) lives in the wasm component — this adapter only derives the
 * frame count and keeps the historical field names the widgets consume.
 */

import type { ScopeChunkReply } from "../pkg/interfaces/scserver-commands-replies.js";

export interface DecodedScopeChunk {
  subId: number;
  tickIndex: number;
  isGap: boolean;
  channels: number;
  frameCount: number;
  /** Planar samples (one frame run per channel — the SHM slot's own
   *  layout), `frameCount × channels` floats. jco lifts the component's
   *  list<f32> into a fresh `Float32Array`, so the worker can transfer
   *  its buffer across postMessage. */
  data: Float32Array;
}

/** Adapt a decoded `scope-chunk` reply payload to the widget shape. */
export function toScopeChunk(val: ScopeChunkReply): DecodedScopeChunk {
  if (val.channels <= 0 || val.samples.length % val.channels !== 0) {
    throw new Error(
      `toScopeChunk: ${val.samples.length} samples do not divide into ${val.channels} channels`,
    );
  }
  return {
    subId: val.subId,
    tickIndex: val.tickIndex,
    isGap: val.isGap,
    channels: val.channels,
    frameCount: val.samples.length / val.channels,
    data: val.samples,
  };
}
