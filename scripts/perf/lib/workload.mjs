// The shared CPU kernel for the single- and multi-thread benches. A float-heavy
// DSP-ish workload (biquad IIR + multiply-accumulate + an integer index/mask),
// more predictive of the audio/scope path than crypto or fib. Deterministic:
// fixed buffer, fixed coefficients, returns a checksum so V8 can't elide it and
// so the SAME number must appear on every host (a correctness cross-check).

import { xorshift32 } from "./stats.mjs";

const N = 4096; // samples per pass

/** Build the fixed input buffer once (seeded, host-independent). */
export function makeBuffer() {
  const rnd = xorshift32(0x1234abcd);
  const buf = new Float32Array(N);
  for (let i = 0; i < N; i++) buf[i] = rnd() * 2 - 1;
  return buf;
}

/**
 * Run `passes` of the kernel over `buf`. Returns a checksum (finite float).
 * One "op" = one pass over the N-sample buffer.
 */
export function runKernel(buf, passes) {
  // Biquad (low-pass-ish) coefficients — fixed.
  const b0 = 0.2929,
    b1 = 0.5858,
    b2 = 0.2929,
    a1 = -0.0,
    a2 = 0.1716;
  let acc = 0;
  let mask = 0x12345;
  for (let p = 0; p < passes; p++) {
    let x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0;
    for (let i = 0; i < buf.length; i++) {
      const x0 = buf[i];
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
      // Integer/ALU component: rotate + mask, fold into acc.
      mask = (mask * 1103515245 + 12345) & 0x7fffffff;
      acc += y0 * (1 + (mask & 0xff) / 256);
    }
  }
  return acc;
}

export const KERNEL_N = N;
