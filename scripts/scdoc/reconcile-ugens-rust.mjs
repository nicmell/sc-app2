// The Rust twin of reconcile-ugens.mjs: idempotent in-place reconcile of the
// vendored crate's @generated UGen registry (src-tauri/crates/
// scsynthdef-compiler/src/{specs,builders}/*.rs) to the SCDoc crawl — the
// same rate-list alignment and the same 8 default-value fixes the TS registry
// received in commit 8880a3e. Needed because the crate's upstream generator
// scripts were never vendored (see memory note), so regex surgery on the
// generated files is the only safe edit.
//
// Re-runnable: setting a value/rate that already matches is a no-op.
//
// Run: node scripts/scdoc/reconcile-ugens-rust.mjs
//      (then: node scripts/scdoc/registry-parity.mjs to verify against TS)

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CRATE = resolve(HERE, "../../src-tauri/crates/scsynthdef-compiler/src");
const SPECS = resolve(CRATE, "specs");
const BUILDERS = resolve(CRATE, "builders");

const CAP = { ar: "Audio", kr: "Control", ir: "Scalar" };
const RATE_ORDER = ["ar", "kr", "ir"];
const canonRates = (short) =>
  [...short].sort((a, b) => RATE_ORDER.indexOf(a) - RATE_ORDER.indexOf(b));

const doc = JSON.parse(readFileSync(resolve(HERE, "out/ugens-doc.json"), "utf8"));
const docRates = new Map(doc.ugens.map((u) => [u.name, canonRates(u.rates)]));

// The 8 genuine numeric default bugs — same list as reconcile-ugens.mjs.
const DEFAULT_FIXES = [
  ["PSinGrain", "amp", 0.1],
  ["Convolution2", "framesize", 2048],
  ["Convolution2L", "framesize", 2048],
  ["Convolution3", "framesize", 2048],
  ["StereoConvolution2L", "framesize", 2048],
  ["GrainBuf", "pos", 0],
  ["Warp1", "windowSize", 0.2],
  ["Spring", "spring", 1],
];

/** Rust float literal for a default (always a decimal point). */
const rustF32 = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`);

const rsFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".rs") && f !== "mod.rs");
const changes = [];

// ── specs: rates slice + the default fixes ─────────────────────────────────
for (const file of rsFiles(SPECS)) {
  const path = resolve(SPECS, file);
  let text = readFileSync(path, "utf8");
  const before = text;

  for (const [name, rates] of docRates) {
    const re = new RegExp(`(name: r"${name}",\\s*\\n\\s*rates: )&\\[[^\\]]*\\]`);
    text = text.replace(re, (m, p1) => {
      const target = `&[${rates.map((r) => `Rate::${CAP[r]}`).join(", ")}]`;
      const current = m.slice(p1.length);
      if (current !== target) changes.push(`spec rates  ${name}: ${current} → ${target}`);
      return p1 + target;
    });
  }

  for (const [name, arg, val] of DEFAULT_FIXES) {
    // Scope to this UGen's entry: from its `name:` to the entry close.
    const entryRe = new RegExp(`(name: r"${name}",[\\s\\S]*?\\n    \\},)`);
    text = text.replace(entryRe, (entry) => {
      const argRe = new RegExp(`(\\(r"${arg}", Some\\()[\\d.eE+-]+(\\)\\))`);
      return entry.replace(argRe, (m, p1, p2) => {
        const target = rustF32(val);
        if (!m.includes(`(${target})`)) changes.push(`spec default ${name}.${arg} → ${target}`);
        return `${p1}${target}${p2}`;
      });
    });
  }

  if (text !== before) writeFileSync(path, text);
}

// ── builders: rate factories + the default seeds ───────────────────────────
const FACTORY_RE =
  /    \/\/\/ Build at (ar|kr|ir) rate \(Rate::\w+\)\.\n    pub fn (?:ar|kr|ir)\(\) -> Self \{[\s\S]*?\n    \}\n/g;

function reconcileBuilderImpl(block, name, targetRates) {
  const factories = [...block.matchAll(FACTORY_RE)];
  const have = factories.map((f) => f[1]);
  const template = factories[0]?.[0];
  if (!template) return block; // no rate factories (operator/abstract builder)

  for (const f of factories) {
    if (!targetRates.includes(f[1])) {
      block = block.replace(f[0], "");
      changes.push(`builder factory ${name}: remove ${f[1]}()`);
    }
  }
  for (const r of targetRates) {
    if (have.includes(r)) continue;
    const src = template.match(/pub fn (ar|kr|ir)\(\)/)[1];
    const clone = template
      .replace(`Build at ${src} rate (Rate::${CAP[src]})`, `Build at ${r} rate (Rate::${CAP[r]})`)
      .replace(`pub fn ${src}()`, `pub fn ${r}()`)
      .replace(`_rate: Rate::${CAP[src]},`, `_rate: Rate::${CAP[r]},`);
    const anchor = [...block.matchAll(FACTORY_RE)].pop();
    const at = anchor.index + anchor[0].length;
    block = block.slice(0, at) + clone + block.slice(at);
    changes.push(`builder factory ${name}: add ${r}()`);
  }
  return block;
}

for (const file of rsFiles(BUILDERS)) {
  const path = resolve(BUILDERS, file);
  let text = readFileSync(path, "utf8");
  const before = text;

  // Split into impl blocks (each `impl X {` … its matching top-level `\n}`).
  const implRe = /impl (\w+) \{[\s\S]*?\n\}/g;
  text = text.replace(implRe, (block, name) => {
    if (docRates.has(name)) {
      block = reconcileBuilderImpl(block, name, docRates.get(name));
    }
    for (const [fixName, arg, val] of DEFAULT_FIXES) {
      if (fixName !== name) continue;
      // Factory seeds: `arg: UGenInput::Constant(N),` — the generated arg
      // field names are snake_case of the doc arg.
      const snake = arg.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      const seedRe = new RegExp(`(\\b${snake}: UGenInput::Constant\\()[\\d.eE+-]+(\\),)`, "g");
      block = block.replace(seedRe, (m, p1, p2) => {
        const target = rustF32(val);
        if (!m.includes(`(${target})`)) changes.push(`builder seed ${name}.${snake} → ${target}`);
        return `${p1}${target}${p2}`;
      });
    }
    return block;
  });

  if (text !== before) writeFileSync(path, text);
}

changes.sort();
console.log(changes.join("\n"));
console.log(`\n${changes.length} changes applied.`);
