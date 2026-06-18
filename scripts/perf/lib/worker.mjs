// worker_threads entrypoint for the multi-core CPU bench. Each worker runs the
// shared kernel in a fixed wall-clock window and reports passes completed.

import { parentPort, workerData } from "node:worker_threads";
import { makeBuffer, runKernel } from "./workload.mjs";

const { windowMs } = workerData;
const buf = makeBuffer();

// Signal readiness, then wait for the "go" so all workers start together
// (excludes worker spawn cost from the measured window).
parentPort.postMessage({ ready: true });

parentPort.once("message", (msg) => {
  if (msg !== "go") return;
  const BATCH = 64; // passes between clock checks
  let passes = 0;
  let checksum = 0;
  const start = process.hrtime.bigint();
  const limit = BigInt(Math.round(windowMs * 1e6));
  while (process.hrtime.bigint() - start < limit) {
    checksum += runKernel(buf, BATCH);
    passes += BATCH;
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  parentPort.postMessage({ passes, elapsedMs, checksum });
});
