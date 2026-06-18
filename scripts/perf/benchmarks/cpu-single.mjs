// Single-thread CPU throughput via the shared float-DSP kernel. Single-core is
// what the scope path actually uses (the bridge's 5 ms poll loop per WS task and
// the per-float client decode are single-threaded), so this is the relevant
// host-side CPU number for the lag diagnosis.

import { timeTrials, round } from "../lib/stats.mjs";
import { makeBuffer, runKernel, KERNEL_N } from "../lib/workload.mjs";

export async function run(ctx) {
  const buf = makeBuffer();
  const passesPerTrial = ctx.quick ? 2000 : 12000; // one pass = KERNEL_N samples
  const t = timeTrials(() => runKernel(buf, passesPerTrial), ctx);

  const opsPerSec = passesPerTrial / (t.medianNs / 1e9);
  const nsPerOp = t.medianNs / passesPerTrial;
  return {
    name: "cpuSingle",
    unit: "ops/s",
    status: "ok",
    metrics: {
      opsPerSec: round(opsPerSec),
      nsPerOp: round(nsPerOp, 1),
      mSamplesPerSec: round((opsPerSec * KERNEL_N) / 1e6),
      cov: round(t.cov, 3),
    },
    checksum: round(t.checksum, 0),
    notes: `op = one ${KERNEL_N}-sample biquad+MAC pass; checksum must match across hosts`,
  };
}
