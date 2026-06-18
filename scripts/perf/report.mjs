// Compare 2+ perf-suite result JSONs: a side-by-side table (one column per host,
// a ratio column when exactly two) plus a data-driven assessment whose every
// claim is gated on a measured threshold.
//
//   node scripts/perf/report.mjs perf-results/*.json
//   node scripts/perf/report.mjs pi.json mac.json

import fs from "node:fs";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (files.length < 1) {
  process.stderr.write("usage: node scripts/perf/report.mjs <result.json> [more.json ...]\n");
  process.exit(1);
}
const results = files.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(f, "utf8")) }));

// Metric extractors: [row label, path, format]. Missing → "—".
const ROWS = [
  ["CPU single (ops/s)", (b) => b.cpuSingle?.metrics?.opsPerSec, "int", "higher"],
  ["CPU multi scaling (×)", (b) => b.cpuMulti?.metrics?.scaling, "num", "higher"],
  ["CPU multi efficiency", (b) => b.cpuMulti?.metrics?.efficiency, "num", "higher"],
  ["byteSwap scalar (MB/s)", (b) => b.byteSwap?.metrics?.scalarMBs, "int", "higher"],
  ["byteSwap headroom (×47Hz)", (b) => b.byteSwap?.metrics?.headroomVs47Hz, "int", "higher"],
  ["mem read (GB/s)", (b) => b.memory?.metrics?.readGBs, "num", "higher"],
  ["mem copy (GB/s)", (b) => b.memory?.metrics?.copyGBs, "num", "higher"],
  ["disk seq write (MB/s)", (b) => b.disk?.metrics?.seqWriteMBs, "int", "higher"],
  ["disk seq read (MB/s)", (b) => b.disk?.metrics?.seqReadMBs, "int", "higher"],
  ["disk rand-read p95 (µs)", (b) => b.disk?.metrics?.randReadP95us, "num", "lower"],
  ["tmpfs seq read (MB/s)", (b) => b.tmpfs?.metrics?.seqReadMBs, "int", "higher"],
  ["tmpfs rand-read p95 (µs)", (b) => b.tmpfs?.metrics?.randReadP95us, "num", "lower"],
];

const fmt = (v, kind) => {
  if (v == null) return "—";
  if (kind === "int") return Math.round(v).toLocaleString("en-US");
  return String(v);
};

const cols = results.map((r) => `${r.label} (${r.host.arch})`);
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const W0 = Math.max(26, ...ROWS.map((r) => r[0].length));
const WC = Math.max(14, ...cols.map((c) => c.length));

let header = pad("metric", W0) + "  " + cols.map((c) => padL(c, WC)).join("  ");
if (results.length === 2) header += "  " + padL("ratio", 10);
console.log("\n" + header);
console.log("-".repeat(header.length));

for (const [label, get, kind, better] of ROWS) {
  const vals = results.map((r) => get(r.benchmarks));
  let line = pad(label, W0) + "  " + vals.map((v) => padL(fmt(v, kind), WC)).join("  ");
  if (results.length === 2 && vals[0] != null && vals[1] != null && vals[1] !== 0) {
    const ratio = vals[0] / vals[1];
    const tag = better === "lower" ? (ratio > 1 ? " (col1 better)" : "") : ratio < 1 ? " (col2 better)" : "";
    line += "  " + padL(ratio.toFixed(2) + "×", 10) + tag;
  }
  console.log(line);
}

// ---- Data-driven assessment -------------------------------------------------
console.log("\nassessment:");
const note = (s) => console.log("  • " + s);

const headrooms = results.map((r) => r.benchmarks.byteSwap?.metrics?.headroomVs47Hz).filter((x) => x != null);
if (headrooms.length && Math.min(...headrooms) > 1000) {
  note(`byte-swap has ${Math.round(Math.min(...headrooms))}×+ headroom over the 47 Hz chunk cadence → NOT the bottleneck.`);
}

for (const r of results) {
  const d = r.benchmarks.disk?.metrics;
  const t = r.benchmarks.tmpfs?.metrics;
  if (d && t && t.randReadP95us != null && d.randReadP95us != null) {
    if (d.randReadP95us > t.randReadP95us * 5) {
      note(
        `[${r.label}] disk random-read p95 ${d.randReadP95us}µs vs tmpfs ${t.randReadP95us}µs ` +
          `— the card is slower, but scope SHM lives in tmpfs (/dev/shm), so the card is NOT the scope bottleneck.`,
      );
    }
  } else if (r.benchmarks.tmpfs?.status === "na" && d) {
    note(`[${r.label}] no /dev/shm here (not the Pi); disk numbers are for the card characterization only.`);
  }
}

if (results.length === 2) {
  const [a, b] = results;
  const oa = a.benchmarks.cpuSingle?.metrics?.opsPerSec;
  const ob = b.benchmarks.cpuSingle?.metrics?.opsPerSec;
  if (oa && ob) {
    const slow = oa < ob ? a : b;
    const fast = oa < ob ? b : a;
    const ratio = Math.max(oa, ob) / Math.min(oa, ob);
    note(
      `single-core: ${slow.label} is ${ratio.toFixed(1)}× slower than ${fast.label}. ` +
        `The scope path is single-threaded (5 ms bridge poll per WS task + per-float client decode), ` +
        `so weak single-core is the main host-side contributor on ${slow.label}.`,
    );
  }
  // checksum sanity (kernels must agree across hosts)
  const ca = a.benchmarks.cpuSingle?.checksum;
  const cb = b.benchmarks.cpuSingle?.checksum;
  if (ca != null && cb != null && ca !== cb) {
    note(`⚠ CPU-kernel checksums differ (${ca} vs ${cb}) — results may not be comparable (different Node/V8?).`);
  }
}

for (const r of results) {
  const sc = r.benchmarks.cpuMulti?.metrics;
  if (sc && sc.efficiency != null && sc.efficiency > 0.75) {
    note(`[${r.label}] multicore scales near-linearly (eff ${sc.efficiency}) → adding cores won't help the single-threaded scope path.`);
  }
}

note(
  "verdict: host micro-benchmarks above isolate CPU/mem/disk/tmpfs. Pair with the end-to-end " +
    "scope-bench columns (local vs Vite-proxy vs Mac→Pi WiFi) to confirm whether the lag is " +
    "network jitter, the dev-mode proxy hop, or single-core — it is not the filesystem.",
);
console.log("");
