// Shared timing + statistics helpers for the perf suite. Pure Node, no deps.

/** Monotonic high-res clock in nanoseconds (BigInt). */
export const nowNs = () => process.hrtime.bigint();

/** Milliseconds between two nowNs() readings. */
export const msSince = (startNs) => Number(process.hrtime.bigint() - startNs) / 1e6;

/** Deterministic xorshift32 PRNG — same sequence on every host (not Math.random). */
export function xorshift32(seed = 0x9e3779b9) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000; // [0,1)
  };
}

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => (xs.length ? sum(xs) / xs.length : 0);

/** Linear-interpolated percentile of an unsorted array. */
export function percentile(xs, p) {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const idx = (p / 100) * (a.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
}

export const median = (xs) => percentile(xs, 50);

export function stddev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}

/** Coefficient of variation (stddev/mean) — flags noisy benchmarks. */
export const cov = (xs) => {
  const m = mean(xs);
  return m === 0 ? 0 : stddev(xs) / m;
};

/** Distribution summary for an array of latencies/intervals. */
export function describe(xs) {
  return {
    count: xs.length,
    mean: mean(xs),
    p50: median(xs),
    p95: percentile(xs, 95),
    p99: percentile(xs, 99),
    min: xs.length ? Math.min(...xs) : 0,
    max: xs.length ? Math.max(...xs) : 0,
    stddev: stddev(xs),
  };
}

/**
 * Run `fn` (returns a numeric checksum) `trials` times after `warmup` discarded
 * runs, timing each with nowNs(). Returns { nsPerTrial[], median, cov, checksum }.
 */
export function timeTrials(fn, { warmup = 5, trials = 15 } = {}) {
  let checksum = 0;
  for (let i = 0; i < warmup; i++) checksum += fn();
  const samples = [];
  for (let i = 0; i < trials; i++) {
    const t = nowNs();
    checksum += fn();
    samples.push(Number(process.hrtime.bigint() - t));
  }
  return { samples, medianNs: median(samples), cov: cov(samples), checksum };
}

/** Round to `d` decimals for tidy JSON. */
export const round = (x, d = 2) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

/** Minimal `--flag value` / `--bool` argv parser (no deps). */
export function parseArgs(argv, defaults = {}) {
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      const n = Number(next);
      out[key] = Number.isNaN(n) || next.trim() === "" ? next : n;
      i++;
    }
  }
  return out;
}
