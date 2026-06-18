// Multi-thread CPU throughput: the same kernel fanned across all cores via
// worker_threads. Reports aggregate ops/s, scaling vs single-thread, and
// efficiency. Tells us whether more cores would help (they won't for the
// single-threaded scope poll/decode path) and exposes Pi thermal throttling.

import os from "node:os";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { round } from "../lib/stats.mjs";
import { makeBuffer, runKernel } from "../lib/workload.mjs";

const WORKER = fileURLToPath(new URL("../lib/worker.mjs", import.meta.url));

function cores() {
  try {
    return os.availableParallelism();
  } catch {
    return os.cpus().length;
  }
}

/** Single-thread baseline measured the same way (fixed window) for a fair ratio. */
function baselineOpsPerSec(windowMs) {
  const buf = makeBuffer();
  const BATCH = 64;
  let passes = 0;
  const start = process.hrtime.bigint();
  const limit = BigInt(Math.round(windowMs * 1e6));
  while (process.hrtime.bigint() - start < limit) {
    runKernel(buf, BATCH);
    passes += BATCH;
  }
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return passes / (ms / 1000);
}

export async function run(ctx) {
  const n = cores();
  const windowMs = ctx.quick ? 600 : 2000;

  const single = baselineOpsPerSec(windowMs);

  // Spawn all workers, wait until every one signals ready, then release "go"
  // together so spawn cost is outside the measured window.
  const workers = [];
  const readys = [];
  const results = [];
  for (let i = 0; i < n; i++) {
    const w = new Worker(WORKER, { workerData: { windowMs } });
    workers.push(w);
    readys.push(new Promise((res) => w.once("message", () => res())));
    results.push(
      new Promise((res, rej) => {
        w.on("message", (m) => m.passes !== undefined && res(m));
        w.on("error", rej);
      }),
    );
  }
  await Promise.all(readys);
  for (const w of workers) w.postMessage("go");
  const out = await Promise.all(results);
  await Promise.all(workers.map((w) => w.terminate()));

  const aggOpsPerSec = out.reduce((a, r) => a + r.passes / (r.elapsedMs / 1000), 0);
  const scaling = aggOpsPerSec / single;
  return {
    name: "cpuMulti",
    unit: "ops/s",
    status: "ok",
    metrics: {
      cores: n,
      singleOpsPerSec: round(single),
      aggOpsPerSec: round(aggOpsPerSec),
      scaling: round(scaling, 2),
      efficiency: round(scaling / n, 2),
    },
    notes: `${n} workers; scaling ${round(scaling, 2)}× of single-core (efficiency ${round(scaling / n, 2)})`,
  };
}
