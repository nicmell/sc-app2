// Byte-swap throughput — the most scope-relevant CPU metric. Mirrors
// src-tauri/src/core/scope/wire.rs encode_scope_chunk: per-u32 native→big-endian
// over one 8 KB slot (1024 frames × 2 ch × 4 B). Also measures the frontend's
// per-float big-endian DECODE (DataView.getFloat32), the other per-chunk cost.
// Reports MB/s and chunks/sec, then HEADROOM over the real ~47 Hz chunk cadence
// — the number that answers "is byte-swap the bottleneck?" (it never is).

import { timeTrials, round } from "../lib/stats.mjs";
import { xorshift32 } from "../lib/stats.mjs";

const CHUNK_BYTES = 1024 * 2 * 4; // 8192
const CHUNK_HZ = 48000 / 1024; // ~46.875

function makeChunk() {
  const buf = Buffer.allocUnsafe(CHUNK_BYTES);
  const rnd = xorshift32(0xcafe1234);
  for (let i = 0; i < CHUNK_BYTES; i += 4) buf.writeFloatLE(rnd() * 2 - 1, i);
  return buf;
}

export async function run(ctx) {
  const iters = ctx.quick ? 20000 : 120000; // buffers per trial → ~hundreds of ms
  const src = makeChunk();
  const dst = Buffer.allocUnsafe(CHUNK_BYTES);
  const srcView = new DataView(src.buffer, src.byteOffset, CHUNK_BYTES);
  const dstView = new DataView(dst.buffer, dst.byteOffset, CHUNK_BYTES);

  // 1. Scalar mirror of wire.rs: read u32 native(LE), write big-endian.
  const scalar = timeTrials(() => {
    let cs = 0;
    for (let k = 0; k < iters; k++) {
      for (let i = 0; i < CHUNK_BYTES; i += 4) {
        dstView.setUint32(i, srcView.getUint32(i, true), false);
      }
      cs += dst[0];
    }
    return cs;
  }, ctx);

  // 2. Buffer.swap32 (Node intrinsic) — the fast-path ceiling.
  const swap32 = timeTrials(() => {
    let cs = 0;
    for (let k = 0; k < iters; k++) {
      src.swap32();
      src.swap32(); // swap back so the buffer is unchanged across trials
      cs += src[0];
    }
    return cs;
  }, ctx);

  // 3. Frontend decode: per-float big-endian read (Node proxy for browser V8).
  const decode = timeTrials(() => {
    let cs = 0;
    for (let k = 0; k < iters; k++) {
      for (let i = 0; i < CHUNK_BYTES; i += 4) cs += srcView.getFloat32(i, false);
    }
    return cs;
  }, ctx);

  const mbps = (medianNs) => (CHUNK_BYTES * iters) / (medianNs / 1e9) / 1e6;
  const chunksPerSec = (medianNs) => iters / (medianNs / 1e9);

  const scalarMBs = mbps(scalar.medianNs);
  const scalarChunks = chunksPerSec(scalar.medianNs);

  return {
    name: "byteSwap",
    unit: "MB/s",
    status: "ok",
    metrics: {
      scalarMBs: round(scalarMBs),
      swap32MBs: round(mbps(swap32.medianNs)),
      decodeMBs: round(mbps(decode.medianNs)),
      chunksPerSec: round(scalarChunks),
      headroomVs47Hz: round(scalarChunks / CHUNK_HZ),
      cov: round(scalar.cov, 3),
    },
    notes:
      `scalar mirrors wire.rs; ${round(scalarChunks)} chunks/s ÷ ${round(CHUNK_HZ)} Hz ` +
      `cadence = ${round(scalarChunks / CHUNK_HZ)}× headroom`,
  };
}
