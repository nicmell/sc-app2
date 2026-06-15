/**
 * Scope tap — reads an audio bus and writes it into one of scsynth's
 * shared-memory scope buffers via `ScopeOut2`. The bridge mmaps that segment
 * and reads slots in-process (no `/b_getn`). Ported from upstream sc-app's
 * `bufferTapSynthDef`.
 *
 * One scope_buffer slot = one chunk: `maxFrames = scopeFrames = chunkSize`, so
 * each triple-buffer slot holds exactly one chunk of audio. The bridge polls
 * SHM on a timer and emits the most-recently-completed slot.
 *
 * Compiled per `(channels, chunkSize)` tuple: `In.ar(bus, channels)` and
 * `ScopeOut2(sigs, …, maxFrames, scopeFrames)` bake the channel + frame counts
 * into the SynthDef. `inBus` / `scopeNum` stay controls so one def serves any
 * bus + scope index.
 *
 * **Critical: `.ar`, not `.kr`.** Audio-rate ScopeOut2 writes every sample;
 * control-rate would write once per 64-sample block (~0.7 Hz to fill a 1024
 * slot) and the scope would look frozen.
 */

import { synthdef, ugenIndex, uo, type UGenInput } from "@sc-app/synthdef-compiler";

export function scopeTapSynthDefName(channels: number, chunkSize: number): string {
  return `scopeTap${channels}ch_${chunkSize}`;
}

const cache = new Map<string, Uint8Array>();

export function compileScopeTapSynthDef(channels: number, chunkSize: number): Uint8Array {
  if (!Number.isInteger(channels) || channels < 1) {
    throw new Error(
      `compileScopeTapSynthDef: channels must be a positive integer, got ${channels}`,
    );
  }
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error(
      `compileScopeTapSynthDef: chunkSize must be a positive integer, got ${chunkSize}`,
    );
  }
  const name = scopeTapSynthDefName(channels, chunkSize);
  const cached = cache.get(name);
  if (cached) return cached;

  const def = synthdef(name, (g, { inBus = 0, scopeNum = 0 }) => {
    // `In.ar(bus, channels)` registers an N-output UGen but the sugar returns a
    // single UGenInput at output 0; fan its outputs into an array so ScopeOut2
    // writes every channel into its planar lane (else every lane but 0 reads
    // flat).
    const inUgen = g.In.ar(inBus, channels);
    const inIdx = ugenIndex(inUgen);
    if (inIdx === null) {
      throw new Error("compileScopeTapSynthDef: In.ar did not return a UGen ref");
    }
    const sigs: UGenInput[] = [];
    for (let c = 0; c < channels; c++) {
      sigs.push(uo(inIdx, c));
    }
    // ScopeOut2(inputArray, scopeNum, maxFrames, scopeFrames). The side effect
    // (writing the SHM scope_buffer) is the work; the output isn't bound.
    g.ScopeOut2.ar(sigs, scopeNum, chunkSize, chunkSize);
  });

  const bytes = def.toBytes();
  cache.set(name, bytes);
  return bytes;
}
