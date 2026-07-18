// Cross-language registry parity gate: diff the vendored crate's UGen
// registry (examples/dump_registry.rs) against the TS package's ALL_SLICES,
// field-for-field (defaults f32-rounded — the Rust side stores f32). Zero
// diffs required while both registries exist; once the TS specs are served
// FROM the wasm build this script retires in favor of snapshot pins.
//
// Run: tsx scripts/scdoc/registry-parity.ts

import { execFileSync } from "node:child_process";
import { ALL_SLICES } from "../../packages/synthdef-compiler/src/specs/index.js";

type Entry = {
  name: string;
  rates: string[];
  defaults: { name: string; default: number | null }[];
  numOutputs: number | null;
  extends: string | null;
};

/** One entry in a comparable normal form (rates lowercased long names,
 *  defaults f32-rounded; docs/summaries excluded — cosmetic text). */
const norm = (e: Entry) => ({
  rates: e.rates.map((r) => r.toLowerCase()),
  defaults: e.defaults.map((d) => ({
    name: d.name,
    default: d.default === null ? null : Math.fround(d.default),
  })),
  numOutputs: e.numOutputs,
  extends: e.extends,
});

const rustRaw = execFileSync(
  "cargo",
  ["run", "-p", "scsynthdef-compiler", "--example", "dump_registry", "--quiet"],
  { cwd: new URL("../../src-tauri", import.meta.url).pathname, maxBuffer: 64 * 1024 * 1024 },
).toString();

type RustEntry = {
  name: string;
  rates: string[];
  defaults: [string, number | null][];
  numOutputs: number | null;
  extends: string | null;
};
const rust = new Map<string, ReturnType<typeof norm>>();
for (const [, entries] of JSON.parse(rustRaw) as [string, RustEntry[]][]) {
  for (const e of entries) {
    rust.set(
      e.name,
      norm({ ...e, defaults: e.defaults.map(([name, d]) => ({ name, default: d })) }),
    );
  }
}

const ts = new Map<string, ReturnType<typeof norm>>();
for (const [, entries] of ALL_SLICES) {
  for (const e of entries) ts.set(e.name, norm(e as unknown as Entry));
}

const diffs: string[] = [];
for (const [name, t] of ts) {
  const r = rust.get(name);
  if (!r) {
    diffs.push(`missing in rust: ${name}`);
    continue;
  }
  const a = JSON.stringify(t);
  const b = JSON.stringify(r);
  if (a !== b) diffs.push(`${name}:\n  ts:   ${a}\n  rust: ${b}`);
}
for (const name of rust.keys()) {
  if (!ts.has(name)) diffs.push(`missing in ts: ${name}`);
}

if (diffs.length) {
  console.error(diffs.join("\n"));
  console.error(`\n${diffs.length} registry divergences.`);
  process.exit(1);
}
console.log(`registry parity OK (${ts.size} entries)`);
