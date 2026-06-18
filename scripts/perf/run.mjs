// Host micro-benchmark runner. Runs the suite, prints a one-line human summary
// to stderr, and writes the full JSON result to perf-results/ (or --out dir,
// or stdout with --stdout). Pure Node, no deps.
//
//   node scripts/perf/run.mjs [--label "pi5"] [--quick] [--only cpu,byteswap]
//                             [--disk-size 1024] [--mem-size 256]
//                             [--out perf-results] [--stdout]

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "./lib/stats.mjs";
import { hostInfo, fsTypeFor, cpuTempC } from "./lib/hostinfo.mjs";

import { run as byteSwap } from "./benchmarks/byteswap.mjs";
import { run as cpuSingle } from "./benchmarks/cpu-single.mjs";
import { run as cpuMulti } from "./benchmarks/cpu-multi.mjs";
import { run as memory } from "./benchmarks/memory.mjs";
import { run as disk } from "./benchmarks/disk.mjs";
import { run as tmpfs } from "./benchmarks/tmpfs.mjs";

const ALL = [
  ["byteswap", byteSwap],
  ["cpu-single", cpuSingle],
  ["cpu-multi", cpuMulti],
  ["memory", memory],
  ["disk", disk],
  ["tmpfs", tmpfs],
];

const args = parseArgs(process.argv.slice(2), { warmup: 5, trials: 15 });
const only = typeof args.only === "string" ? new Set(args.only.split(",")) : null;
const ctx = {
  quick: !!args.quick,
  warmup: args.quick ? 3 : args.warmup,
  trials: args.quick ? 7 : args.trials,
  diskSize: typeof args["disk-size"] === "number" ? args["disk-size"] : undefined,
  memSize: typeof args["mem-size"] === "number" ? args["mem-size"] : undefined,
};

const host = hostInfo();
const benchmarks = {};
for (const [key, fn] of ALL) {
  if (only && !only.has(key)) continue;
  process.stderr.write(`  running ${key} …\n`);
  try {
    const r = await fn(ctx);
    benchmarks[r.name] = r;
  } catch (e) {
    benchmarks[key] = { name: key, status: "error", error: String(e?.stack ?? e) };
    process.stderr.write(`    ! ${key} failed: ${e?.message ?? e}\n`);
  }
}

const result = {
  schemaVersion: 1,
  label: typeof args.label === "string" ? args.label : host.hostname,
  timestamp: new Date().toISOString(),
  host,
  fsType: fsTypeFor(process.cwd()),
  cpuTempEndC: cpuTempC(),
  config: ctx,
  benchmarks,
};

const json = JSON.stringify(result, null, 2);
if (args.stdout) {
  process.stdout.write(json + "\n");
} else {
  const outDir = typeof args.out === "string" ? args.out : "perf-results";
  fs.mkdirSync(outDir, { recursive: true });
  const safe = result.timestamp.replace(/[:.]/g, "-");
  const file = path.join(outDir, `${host.hostname}-${host.arch}-${safe}.json`);
  fs.writeFileSync(file, json);
  process.stderr.write(`\nwrote ${file}\n`);
}

// One-line summary to stderr.
const bs = benchmarks.byteSwap?.metrics;
const cs = benchmarks.cpuSingle?.metrics;
process.stderr.write(
  `summary [${result.label}] ${host.arch} ${host.cpuModel} x${host.cpuCount}: ` +
    `cpu1=${cs?.opsPerSec ?? "?"} ops/s, byteSwap=${bs?.headroomVs47Hz ?? "?"}× headroom\n`,
);
