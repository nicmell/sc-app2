// Minimal adaptive micro-benchmark harness for the browser.
//
// Each case is run in short batches until a wall-clock budget elapses,
// then reported as ops/sec. A running `sink` value is fed back from every
// iteration to stop the JIT dead-code-eliminating the work under test.

export interface Timing {
  opsPerSec: number;
  nsPerOp: number;
  iters: number;
  ms: number;
}

let sink = 0;
/** Swallow a value so the optimiser can't drop the benchmarked call. */
export function keep(n: number): void {
  sink += n;
}
/** Read + reset the sink (call once at the end so `sink` isn't unused). */
export function drainSink(): number {
  const v = sink;
  sink = 0;
  return v;
}

export interface BenchOpts {
  /** Wall-clock budget for the measured phase (ms). */
  minTimeMs?: number;
  /** Wall-clock budget for warmup (ms). */
  warmupMs?: number;
  /** Iterations per timing batch (amortises performance.now() overhead). */
  batch?: number;
}

/** Time `fn` adaptively and return ops/sec. `fn` should call `keep(...)`. */
export function measure(fn: () => void, opts: BenchOpts = {}): Timing {
  const minTimeMs = opts.minTimeMs ?? 350;
  const warmupMs = opts.warmupMs ?? 80;
  const batch = opts.batch ?? 512;

  // Warmup — let the JIT specialise.
  let w0 = performance.now();
  while (performance.now() - w0 < warmupMs) {
    for (let i = 0; i < batch; i++) fn();
  }

  // Measure.
  let iters = 0;
  const t0 = performance.now();
  let elapsed = 0;
  while (elapsed < minTimeMs) {
    for (let i = 0; i < batch; i++) fn();
    iters += batch;
    elapsed = performance.now() - t0;
  }

  const opsPerSec = iters / (elapsed / 1000);
  return { opsPerSec, nsPerOp: 1e9 / opsPerSec, iters, ms: elapsed };
}
