// One-shot (idempotent) reconcile of the committed UGen registry to the SCDoc
// crawl (scripts/scdoc/out/ugens-doc.json): align rate lists and fix the
// genuine default-value bugs, in BOTH the specs (the compiler's source) and the
// builders (the typed API). Only touches UGens present in both, and only the
// real divergences — cosmetic diffs (arg-name casing, f32 precision, the
// mul/add tail, null-vs-0) are left as-is.
//
// Re-runnable: setting a value/rate that already matches is a no-op.
//
// Run: node scripts/scdoc/reconcile-ugens.mjs   (then: yarn scdoc:diff to verify)

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, "../../packages/synthdef-compiler/src");
const SPECS = resolve(PKG, "specs");
const BUILDERS = resolve(PKG, "builders");

const LONG = { ar: "audio", kr: "control", ir: "scalar" };
const CAP = { ar: "Audio", kr: "Control", ir: "Scalar" };
const RATE_ORDER = ["ar", "kr", "ir"];
const canonRates = (short) =>
  [...short].sort((a, b) => RATE_ORDER.indexOf(a) - RATE_ORDER.indexOf(b));

const doc = JSON.parse(readFileSync(resolve(HERE, "out/ugens-doc.json"), "utf8"));
const docRates = new Map(doc.ugens.map((u) => [u.name, canonRates(u.rates)]));

// The 8 genuine numeric default bugs (doc-authoritative values). Cosmetic
// (f32/null) diffs are deliberately excluded.
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

const tsFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
const changes = [];

// ── specs: rates array + the default fixes ──────────────────────────────────
for (const file of tsFiles(SPECS)) {
  const path = resolve(SPECS, file);
  let text = readFileSync(path, "utf8");
  const before = text;

  for (const [name, rates] of docRates) {
    const re = new RegExp(`(name: "${name}",\\s*\\n\\s*rates: )\\[[^\\]]*\\]`);
    text = text.replace(re, (m, p1, offset) => {
      const target = `[${rates.map((r) => `"${LONG[r]}"`).join(", ")}]`;
      const current = m.slice(p1.length);
      if (current !== target) changes.push(`spec rates  ${name}: ${current} → ${target}`);
      return p1 + target;
    });
  }

  for (const [name, arg, val] of DEFAULT_FIXES) {
    // Scope to this UGen's entry: from its `name:` to the entry close.
    const entryRe = new RegExp(`(name: "${name}",[\\s\\S]*?\\n  \\},)`);
    text = text.replace(entryRe, (entry) => {
      const argRe = new RegExp(`(\\{ name: "${arg}", default: )[\\d.eE+-]+( \\})`);
      return entry.replace(argRe, (m, p1, p2) => {
        if (!m.includes(`: ${val} `)) changes.push(`spec default ${name}.${arg} → ${val}`);
        return `${p1}${val}${p2}`;
      });
    });
  }

  if (text !== before) writeFileSync(path, text);
}

// ── builders: rate factories + the default seeds ────────────────────────────
const FACTORY_RE =
  /  \/\*\* Build at (ar|kr|ir) rate \(Rate::\w+\)\. \*\/\n  static (?:ar|kr|ir)\(\): \w+ \{[\s\S]*?\n  \}\n/g;

function reconcileBuilderClass(block, className, targetRates) {
  const factories = [...block.matchAll(FACTORY_RE)];
  const have = factories.map((f) => f[1]);
  const template = factories[0]?.[0];
  if (!template) return block; // no rate factories (operator/abstract builder)

  // Remove factories whose rate isn't in the target.
  for (const f of factories) {
    if (!targetRates.includes(f[1])) {
      block = block.replace(f[0], "");
      changes.push(`builder factory ${className}: remove ${f[1]}()`);
    }
  }
  // Add missing target rates, cloned from the template, in canonical order.
  for (const r of targetRates) {
    if (have.includes(r)) continue;
    const src = template.match(/static (ar|kr|ir)\(\)/)[1];
    const clone = template
      .replace(`Build at ${src} rate (Rate::${CAP[src]})`, `Build at ${r} rate (Rate::${CAP[r]})`)
      .replace(`static ${src}()`, `static ${r}()`)
      .replace(`_calcRate = "${LONG[src]}"`, `_calcRate = "${LONG[r]}"`);
    // Insert after the last remaining factory.
    const anchor = [...block.matchAll(FACTORY_RE)].pop();
    const at = anchor.index + anchor[0].length;
    block = block.slice(0, at) + clone + block.slice(at);
    changes.push(`builder factory ${className}: add ${r}()`);
  }
  return block;
}

for (const file of tsFiles(BUILDERS)) {
  const path = resolve(BUILDERS, file);
  let text = readFileSync(path, "utf8");
  const before = text;

  // Split into class blocks (each `export class X {` … matching `\n}`).
  const classRe = /export class (\w+) \{[\s\S]*?\n\}/g;
  text = text.replace(classRe, (block, className) => {
    if (docRates.has(className)) {
      block = reconcileBuilderClass(block, className, docRates.get(className));
    }
    for (const [name, arg, val] of DEFAULT_FIXES) {
      if (name !== className) continue;
      const seedRe = new RegExp(`(_${arg} = \\{ tag: "constant", val: )[\\d.eE+-]+( \\})`, "g");
      block = block.replace(seedRe, (m, p1, p2) => {
        if (!m.includes(`: ${val} `)) changes.push(`builder seed ${className}._${arg} → ${val}`);
        return `${p1}${val}${p2}`;
      });
    }
    return block;
  });

  if (text !== before) writeFileSync(path, text);
}

changes.sort();
console.log(changes.join("\n"));
console.log(`\n${changes.length} changes applied.`);
