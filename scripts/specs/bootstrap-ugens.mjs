#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const buildersDir = join(root, "src-tauri/crates/scsynthdef-compiler/src/builders");
const out = join(root, "assets/specs/ugens.json");
const snakeToCamel = (s) => s.replace(/^r#/, "").replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const fail = (messages) => { for (const m of messages) console.error(m); process.exit(1); };
function block(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error("unclosed Rust block");
}

const builders = new Map();
for (const file of readdirSync(buildersDir).filter((f) => f.endsWith(".rs") && f !== "mod.rs")) {
  const text = readFileSync(join(buildersDir, file), "utf8");
  const re = /pub struct (\w+) \{\n([\s\S]*?)\n\}/g;
  for (let m; (m = re.exec(text));) {
    const fields = [...m[2].matchAll(/^\s*(?:pub )?((?:r#)?\w+): (UGenInput|Vec<UGenInput>|u32),\s*$/gm)]
      .filter((x) => x[1] !== "_rate").map((x) => ({ name: x[1], normalized: snakeToCamel(x[1]), type: x[2] }));
    const marker = `impl ${m[1]} {`;
    const start = text.indexOf(marker, m.index);
    if (start < 0) continue;
    const body = block(text, start + marker.length - 1);
    const rates = [...body.matchAll(/pub fn (ar|kr|ir)\(\) -> Self/g)].map((x) => x[1]);
    builders.set(m[1], { fields, rates, body, file });
  }
}

const dump = JSON.parse(execFileSync("cargo", ["run", "--example", "dump_registry", "-p", "scsynthdef-compiler", "--quiet"], {
  cwd: join(root, "src-tauri"), encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}));
const rateMap = { Audio: "ar", Control: "kr", Scalar: "ir" };
const errors = [], noBuilder = [], anomalies = [], kinds = { input: 0, inputArray: 0, u32: 0 };
let matched = 0, total = 0;
const categories = dump.map(([name, entries]) => ({ name, ugens: entries.map((entry) => {
  total++;
  const b = builders.get(entry.name);
  const registryRates = entry.rates.map((r) => rateMap[r]);
  if (registryRates.some((r) => !r)) errors.push(`${entry.name}: unknown registry rate ${JSON.stringify(entry.rates)}`);
  if (b) {
    matched++;
    if (b.rates.length && [...registryRates].sort().join() !== [...b.rates].sort().join()) errors.push(`${entry.name}: rate sets registry=${registryRates} builder=${b.rates}`);
    if (b.rates.length && JSON.stringify(registryRates) !== JSON.stringify(b.rates)) anomalies.push(`${entry.name}: factory order ${b.rates.join(",")} differs from registry order ${registryRates.join(",")}`);
    if (!b.rates.length) anomalies.push(`${entry.name}: internalized builder has no public rate factory; used registry rates`);
    const registryArgs = entry.defaults.map(([n]) => n);
    const builderArgs = b.fields.map((f) => f.normalized);
    const canonical = (s) => s.toLowerCase();
    if (registryArgs.map(canonical).sort().join() !== builderArgs.map(canonical).sort().join()) errors.push(`${entry.name}: arg sets registry=${registryArgs.join(",")} builder=${builderArgs.join(",")} (${b.file})`);
    else if (registryArgs.map(canonical).join() !== builderArgs.map(canonical).join()) anomalies.push(`${entry.name}: output-count/variadic builder field order differs; emitted registry order`);
  } else noBuilder.push(entry.name);
  const docs = new Map(entry.argDocs ?? []);
  const args = entry.defaults.map(([argName, defaultValue]) => {
    const field = b?.fields.find((f) => f.normalized.toLowerCase() === argName.toLowerCase());
    const kind = field?.type === "u32" ? "u32" : field?.type === "Vec<UGenInput>" ? "inputArray" : "input";
    kinds[kind]++;
    const arg = { name: argName };
    if (kind !== "input") arg.kind = kind;
    arg.default = defaultValue;
    if (docs.has(argName)) arg.doc = docs.get(argName);
    return arg;
  });
  let numOutputs = typeof entry.numOutputs === "number" ? entry.numOutputs : null;
  if (b) {
    const dynamic = b.body.match(/let num_outputs: u32 = self\.((?:r#)?\w+);/);
    const literal = b.body.match(/let num_outputs: u32 = (\d+);/);
    if (dynamic) numOutputs = { fromArg: snakeToCamel(dynamic[1]) };
    else if (literal) {
      const expected = numOutputs ?? 1;
      if (+literal[1] !== expected) errors.push(`${entry.name}: numOutputs registry/emitted=${numOutputs} (effective ${expected}) builder literal=${literal[1]}`);
    }
  }
  const ugen = { name: entry.name, rates: registryRates, numOutputs };
  for (const key of ["summary", "doc", "signalRange", "extends"]) if (entry[key] != null) ugen[key] = entry[key];
  if (!b) ugen.noBuilder = true;
  if (b) {
    // Wire input order: the pushes/extends in build(), in source order.
    // When it differs from the args order (registry/sclang signature), the
    // spec records it as buildOrder — the byte-level contract.
    const canonical = (s) => s.toLowerCase();
    const pushed = [...b.body.matchAll(/inputs\.(?:push|extend)\(self\.((?:r#)?\w+)\)/g)]
      .map(([, f]) => args.find((a) => canonical(a.name) === canonical(snakeToCamel(f)))?.name ?? fail([`${entry.name}: build() pushes unknown field ${f}`]));
    const declared = args.filter((a) => a.kind !== "u32").map((a) => a.name);
    if (pushed.join() !== declared.join()) ugen.buildOrder = pushed;
  }
  ugen.args = args;
  return ugen;
}) }));

if (dump.length !== 24 || total !== 367 || matched !== 365) errors.push(`count parity: categories=${dump.length}/24 ugens=${total}/367 builders=${matched}/365`);
if (builders.size !== matched) errors.push(`builder coverage: parsed=${builders.size} matched=${matched}`);
if (errors.length) fail(errors);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ categories }, null, 2) + "\n");
console.log(`UGens parity OK: categories=${dump.length}, ugens=${total}, builders=${matched}, noBuilder=[${noBuilder.join(", ")}], args=${JSON.stringify(kinds)}, anomalies=${anomalies.length}`);
for (const anomaly of anomalies) console.log(`  anomaly: ${anomaly}`);
