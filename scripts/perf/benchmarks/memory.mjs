// Memory bandwidth: sequential read (sum reduction) and copy over a buffer sized
// past the last-level cache, so it measures DRAM not cache. Reads os.freemem to
// stay safe on the Pi. SHM scope reads are memory-bound, so this bounds the
// best case the bridge's slot-copy could achieve.

import os from "node:os";
import { nowNs, round } from "../lib/stats.mjs";

export async function run(ctx) {
  const cap = ctx.memSize ? ctx.memSize * 1024 * 1024 : 256 * 1024 * 1024;
  const safe = Math.floor(os.freemem() * 0.25);
  const bytes = Math.max(16 * 1024 * 1024, Math.min(cap, safe));
  const elems = Math.floor(bytes / 8);

  const a = new Float64Array(elems);
  for (let i = 0; i < elems; i++) a[i] = i * 1.000001;
  const b = new Float64Array(elems);

  const reps = ctx.quick ? 3 : 8;

  // Sequential read (sum). Accumulator consumed so it isn't elided.
  let sink = 0;
  let tRead = nowNs();
  for (let r = 0; r < reps; r++) {
    let s = 0;
    for (let i = 0; i < elems; i++) s += a[i];
    sink += s;
  }
  const readMs = Number(process.hrtime.bigint() - tRead) / 1e6;

  // Copy (typed-array set, the intrinsic path).
  let tCopy = nowNs();
  for (let r = 0; r < reps; r++) b.set(a);
  const copyMs = Number(process.hrtime.bigint() - tCopy) / 1e6;
  sink += b[elems - 1];

  const gbps = (ms) => (bytes * reps) / (ms / 1000) / 1e9;
  return {
    name: "memory",
    unit: "GB/s",
    status: "ok",
    metrics: {
      bufferMB: round(bytes / 1024 / 1024, 0),
      readGBs: round(gbps(readMs), 2),
      copyGBs: round(gbps(copyMs), 2),
    },
    notes: `${round(bytes / 1024 / 1024, 0)} MB buffer (sink=${round(sink, 0)})`,
  };
}
