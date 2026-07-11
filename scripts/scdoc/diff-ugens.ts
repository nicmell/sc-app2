// Compare the SCDoc-crawled UGen registry (scripts/scdoc/out/ugens-doc.json,
// from extract-ugens.mjs) with the committed registry
// (packages/synthdef-compiler specs). The two come from different sources
// (SCDoc HTML vs an Overtone dump), so differences are expected; this report
// classifies them. Writes scripts/scdoc/out/ugens-diff.md and prints a summary.
//
// Run: tsx scripts/scdoc/diff-ugens.ts

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ugensByCategory } from "@sc-app/synthdef-compiler";

const HERE = dirname(fileURLToPath(import.meta.url));
const RATE = { audio: "ar", control: "kr", scalar: "ir" } as const;

interface DocArg {
  name: string;
  default: number | string | null;
}
interface DocUgen {
  name: string;
  rates: string[];
  defaults: DocArg[];
}

const doc: { ugens: DocUgen[] } = JSON.parse(
  readFileSync(resolve(HERE, "out/ugens-doc.json"), "utf8"),
);
const docByName = new Map(doc.ugens.map((u) => [u.name, u]));

// The committed registry, flattened + rates normalized to ar/kr/ir.
const reg = ugensByCategory()
  .flatMap(([, entries]) => entries)
  .map((e) => ({
    name: e.name,
    rates: e.rates.map((r) => RATE[r as keyof typeof RATE] ?? r),
    defaults: e.defaults as DocArg[],
  }));
const regByName = new Map(reg.map((e) => [e.name, e]));

const sorted = (a: string[]) => [...a].sort().join(",");

const onlyDoc = [...docByName.keys()].filter((n) => !regByName.has(n)).sort();
const onlyReg = [...regByName.keys()].filter((n) => !docByName.has(n)).sort();
const common = [...regByName.keys()].filter((n) => docByName.has(n)).sort();

const rateMismatches: string[] = [];
const muladd: string[] = []; // doc trailing mul/add absent from the registry
const argNameDiffs: string[] = [];
const defaultDiffs: string[] = [];

for (const name of common) {
  const d = docByName.get(name)!;
  const r = regByName.get(name)!;
  if (sorted(d.rates) !== sorted(r.rates)) {
    rateMismatches.push(`${name}: doc[${sorted(d.rates)}] vs reg[${sorted(r.rates)}]`);
  }
  const dNames = d.defaults.map((a) => a.name);
  const rNames = r.defaults.map((a) => a.name);
  const extraDoc = dNames.filter((n) => !rNames.includes(n));
  const extraReg = rNames.filter((n) => !dNames.includes(n));
  if (extraDoc.length === 2 && extraDoc.join(",") === "mul,add" && extraReg.length === 0) {
    muladd.push(name);
  } else if (extraDoc.length || extraReg.length) {
    argNameDiffs.push(
      `${name}: doc-only[${extraDoc.join(",") || "—"}] reg-only[${extraReg.join(",") || "—"}]`,
    );
  }
  // Default-value diffs on shared arg names (numeric compare; note type gaps).
  const rMap = new Map(r.defaults.map((a) => [a.name, a.default]));
  for (const a of d.defaults) {
    if (!rMap.has(a.name)) continue;
    const rv = rMap.get(a.name)!;
    const same = typeof a.default === "number" && typeof rv === "number"
      ? Math.abs(a.default - rv) < 1e-9
      : a.default === rv || (a.default === null && rv === null);
    if (!same) defaultDiffs.push(`${name}.${a.name}: doc=${fmt(a.default)} reg=${fmt(rv)}`);
  }
}

function fmt(v: number | string | null): string {
  return v === null ? "null" : typeof v === "string" ? `"${v}"` : String(v);
}

const lines: string[] = [];
const h = (s: string) => lines.push("", `## ${s}`, "");
const list = (xs: string[], max = 1e9) => {
  xs.slice(0, max).forEach((x) => lines.push(`- ${x}`));
  if (xs.length > max) lines.push(`- …and ${xs.length - max} more`);
};

lines.push("# UGen registry: SCDoc crawl vs committed specs");
lines.push("");
lines.push(`- doc UGens (with ar/kr/ir): **${doc.ugens.length}**`);
lines.push(`- registry UGens: **${reg.length}**`);
lines.push(`- in common: **${common.length}**`);
lines.push(`- only in doc: **${onlyDoc.length}**   only in registry: **${onlyReg.length}**`);
lines.push(
  `- of common: **${muladd.length}** carry the doc's trailing \`mul, add\` (the \`.ar\`` +
    ` wrapper args; scsynth applies them via MulAdd, so the Overtone-based registry omits them — expected)`,
);
lines.push(
  `- rate mismatches: **${rateMismatches.length}**, other arg-name diffs: **${argNameDiffs.length}**,` +
    ` default-value diffs: **${defaultDiffs.length}**`,
);

h("Only in the SCDoc crawl (candidates missing from the registry)");
list(onlyDoc);
h("Only in the committed registry (not found in the standard UGens crawl)");
list(onlyReg);
h("Rate mismatches");
list(rateMismatches);
h("Argument-name differences (excluding the expected mul/add tail)");
list(argNameDiffs);
h("Default-value differences (shared args)");
list(defaultDiffs);

const out = resolve(HERE, "out/ugens-diff.md");
writeFileSync(out, lines.join("\n") + "\n");

console.log(lines.slice(0, 9).join("\n"));
console.log(`\nwrote ${out}`);
