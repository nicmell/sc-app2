import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Rate = "ar" | "kr" | "ir";
type Kind = "input" | "inputArray" | "u32";
type Outputs = number | { fromArg: string } | null;
interface Arg { name: string; kind: Kind; default: number | null; doc: string | null }
interface Ugen { name: string; rates: Rate[]; numOutputs: Outputs; summary: string | null; doc: string | null; signalRange: string | null; extends: string | null; noBuilder: boolean; buildOrder: string[] | null; args: Arg[] }
interface Category { name: string; ugens: Ugen[] }
interface Ugens { categories: Category[] }
interface EnvArg { name: string; default: number; array: boolean; modulatable: boolean; doc: string | null }
interface EnvShape { name: string; releaseNode: number | null; loopNode: number | null; doc: string | null; args: EnvArg[] }
interface Envs { shapes: EnvShape[] }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const KEYWORDS = new Set("as box break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return static struct trait true type unsafe use where while".split(" "));

function fail(path: string, message: string): never { throw new Error(`${path}: ${message}`); }
function obj(v: unknown, p: string): Record<string, unknown> { if (!v || typeof v !== "object" || Array.isArray(v)) fail(p, "expected object"); return v as Record<string, unknown>; }
function fields(v: Record<string, unknown>, allowed: string[], required: string[], p: string): void { for (const k of Object.keys(v)) if (!allowed.includes(k)) fail(`${p}.${k}`, "unknown field"); for (const k of required) if (!(k in v)) fail(`${p}.${k}`, "missing field"); }
function arr(v: unknown, p: string): unknown[] { if (!Array.isArray(v)) fail(p, "expected array"); return v; }
function str(v: unknown, p: string): string { if (typeof v !== "string") fail(p, "expected string"); return v; }
function num(v: unknown, p: string): number { if (typeof v !== "number" || !Number.isFinite(v)) fail(p, "expected finite number"); return v; }
function bool(v: unknown, p: string): boolean { if (v === undefined) return false; if (typeof v !== "boolean") fail(p, "expected boolean"); return v; }
function optStrField(v: unknown, p: string): string | null { return v == null ? null : str(v, p); }
function optInt(v: unknown, p: string): number | null { if (v == null) return null; const n = num(v, p); if (!Number.isInteger(n)) fail(p, "expected integer"); return n; }

function loadUgens(): Ugens {
  const root = obj(JSON.parse(readFileSync(resolve(ROOT, "packages/synthdef-compiler/specs/ugens.json"), "utf8")), "ugens.json"); fields(root, ["categories"], ["categories"], "ugens.json");
  const categories = arr(root.categories, "ugens.json.categories").map((cv, ci) => { const p = `ugens.json.categories[${ci}]`, c = obj(cv, p); fields(c, ["name", "ugens"], ["name", "ugens"], p);
    const ugens = arr(c.ugens, `${p}.ugens`).map((uv, ui) => { const q = `${p}.ugens[${ui}]`, u = obj(uv, q); fields(u, ["name", "rates", "numOutputs", "summary", "doc", "signalRange", "extends", "noBuilder", "buildOrder", "args"], ["name", "rates", "args"], q);
      const rates = arr(u.rates, `${q}.rates`).map((rv, ri) => { const r = str(rv, `${q}.rates[${ri}]`); if (!["ar", "kr", "ir"].includes(r)) fail(`${q}.rates[${ri}]`, `invalid rate ${r}`); return r as Rate; });
      let numOutputs: Outputs = null; if (u.numOutputs != null) { if (typeof u.numOutputs === "number") { numOutputs = num(u.numOutputs, `${q}.numOutputs`); if (!Number.isInteger(numOutputs) || numOutputs < 0) fail(`${q}.numOutputs`, "expected non-negative integer"); } else { const o = obj(u.numOutputs, `${q}.numOutputs`); fields(o, ["fromArg"], ["fromArg"], `${q}.numOutputs`); numOutputs = { fromArg: str(o.fromArg, `${q}.numOutputs.fromArg`) }; } }
      const args = arr(u.args, `${q}.args`).map((av, ai) => { const z = `${q}.args[${ai}]`, a = obj(av, z); fields(a, ["name", "kind", "default", "doc"], ["name"], z); const k = a.kind === undefined ? "input" : str(a.kind, `${z}.kind`); if (!["input", "inputArray", "u32"].includes(k)) fail(`${z}.kind`, `invalid kind ${k}`); return { name: str(a.name, `${z}.name`), kind: k as Kind, default: a.default == null ? null : num(a.default, `${z}.default`), doc: optStrField(a.doc, `${z}.doc`) }; });
      const buildOrder = u.buildOrder == null ? null : arr(u.buildOrder, `${q}.buildOrder`).map((v, i) => str(v, `${q}.buildOrder[${i}]`)); return { name: str(u.name, `${q}.name`), rates, numOutputs, summary: optStrField(u.summary, `${q}.summary`), doc: optStrField(u.doc, `${q}.doc`), signalRange: optStrField(u.signalRange, `${q}.signalRange`), extends: optStrField(u.extends, `${q}.extends`), noBuilder: bool(u.noBuilder, `${q}.noBuilder`), buildOrder, args }; });
    return { name: str(c.name, `${p}.name`), ugens }; });
  if (categories.length !== 24) fail("ugens.json.categories", `expected 24, got ${categories.length}`); const count = categories.reduce((n, c) => n + c.ugens.length, 0); if (count !== 367) fail("ugens.json", `expected 367 ugens, got ${count}`); return { categories };
}
function loadEnvs(): Envs { const root = obj(JSON.parse(readFileSync(resolve(ROOT, "packages/synthdef-compiler/specs/envs.json"), "utf8")), "envs.json"); fields(root, ["shapes"], ["shapes"], "envs.json"); const shapes = arr(root.shapes, "envs.json.shapes").map((sv, si) => { const p = `envs.json.shapes[${si}]`, s = obj(sv, p); fields(s, ["name", "releaseNode", "loopNode", "doc", "args"], ["name", "args"], p); const args = arr(s.args, `${p}.args`).map((av, ai) => { const q = `${p}.args[${ai}]`, a = obj(av, q); fields(a, ["name", "default", "array", "modulatable", "doc"], ["name", "default"], q); return { name: str(a.name, `${q}.name`), default: num(a.default, `${q}.default`), array: bool(a.array, `${q}.array`), modulatable: bool(a.modulatable, `${q}.modulatable`), doc: optStrField(a.doc, `${q}.doc`) }; }); return { name: str(s.name, `${p}.name`), releaseNode: optInt(s.releaseNode, `${p}.releaseNode`), loopNode: optInt(s.loopNode, `${p}.loopNode`), doc: optStrField(s.doc, `${p}.doc`), args }; }); if (shapes.length !== 12) fail("envs.json.shapes", `expected 12, got ${shapes.length}`); return { shapes }; }

const header = (f: "ugens" | "envs") => `// @generated by packages/synthdef-compiler/scripts/generate-rust.ts from specs/${f}.json — do not edit.\n// Regenerate with \`yarn generate:synthdef-compiler\`.\n\n`;
function camelToSnake(s: string): string { return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase(); }
function snakeToCamel(s: string): string { let out = "", upper = false; for (const c of s) if (c === "_") upper = true; else if (upper) { out += c.toUpperCase(); upper = false; } else out += c; return out; }
function ident(name: string): string { const s = camelToSnake(name); return KEYWORDS.has(s) ? `r#${s}` : s; }
const jsKey = (name: string) => snakeToCamel(camelToSnake(name));
function raw(s: string): string { let n = 0; while (s.includes(`"${"#".repeat(n)}`)) n++; const h = "#".repeat(n); return `r${h}"${s}"${h}`; }
function f32(v: number): string { if (!Number.isFinite(v)) throw new Error(`spec default ${v} is not a finite number`); const s = String(v); return s.includes(".") ? s : `${s}.0`; }
const optional = (v: string | null) => v === null ? "None" : `Some(${raw(v)})`;
const variant = (r: Rate) => r === "ar" ? "Audio" : r === "kr" ? "Control" : "Scalar";
const docs = (indent: string, text: string) => text.split("\n").map(line => `${indent}#[doc = "${line.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]\n`).join("");
interface BField { ident: string; js: string; kind: Kind; doc: string | null; init: string }
function builderFields(u: Ugen): BField[] { return u.args.map(a => ({ ident: ident(a.name), js: jsKey(a.name), kind: a.kind, doc: a.doc, init: a.kind === "input" ? `UGenInput::Constant(${f32(a.default ?? 0)})` : a.kind === "inputArray" ? "Vec::new()" : `${Math.trunc(a.default ?? 1)}u32` })); }
const kind = (k: Kind) => k === "inputArray" ? "array" : k;
const ty = (k: Kind) => k === "input" ? "UGenInput" : k === "inputArray" ? "Vec<UGenInput>" : "u32";
function pushes(u: Ugen): [Kind, string][] { return (u.buildOrder ?? u.args.filter(a => a.kind !== "u32").map(a => a.name)).map(name => { const a = u.args.find(x => x.name === name); if (!a) throw new Error(`${u.name}: buildOrder names unknown arg ${name}`); return [a.kind, ident(a.name)]; }); }
const outputs = (u: Ugen) => typeof u.numOutputs === "number" ? `fixed ${u.numOutputs}` : u.numOutputs ? `from ${ident(u.numOutputs.fromArg)}` : "fixed 1";
const buildable = (u: Ugen) => !u.noBuilder && u.rates.length > 0;

function specCategory(c: Category): string { let o = header("ugens") + "use crate::registry::UGenRegistryEntry;\nuse crate::Rate;\n\npub(crate) const UGENS: &[UGenRegistryEntry] = &[\n"; for (const u of [...c.ugens].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) { o += `    UGenRegistryEntry {\n        name: r"${u.name}",\n        rates: &[${u.rates.map(r => `Rate::${variant(r)}`).join(", ")}],\n        defaults: &[${u.args.map(a => `(r"${a.name}", ${a.default === null ? "None" : `Some(${f32(a.default)})`})`).join(", ")}],\n        num_outputs: ${typeof u.numOutputs === "number" ? `Some(${u.numOutputs})` : "None"},\n        extends: ${optional(u.extends)},\n        summary: ${optional(u.summary)},\n        doc: ${optional(u.doc)},\n        signal_range: ${optional(u.signalRange)},\n        arg_docs: &[${u.args.filter(a => a.doc !== null).map(a => `(r"${a.name}", ${raw(a.doc!)})`).join(", ")}],\n    },\n`; } return o + "];\n"; }
function specsMod(s: Ugens): string { let o = header("ugens") + "use crate::registry::UGenRegistryEntry;\n\n"; for (const c of s.categories) o += `pub(crate) mod ${c.name};\n`; o += "\npub(crate) const ALL_SLICES: &[(&str, &[UGenRegistryEntry])] = &[\n"; for (const c of s.categories) o += `    ("${c.name}", ${c.name}::UGENS),\n`; return o + "];\n"; }
function builderCategory(c: Category): string { let o = header("ugens") + "#![allow(\n    non_camel_case_types,\n    unused_mut,\n    unused_variables,\n    clippy::useless_conversion,\n    clippy::needless_update\n)]\n\nuse crate::{Rate, SynthDef, UGenInput};\n\nsc_ugens! {\n"; for (const u of c.ugens.filter(buildable)) { if (u.summary) o += docs("    ", u.summary); if (u.doc) { if (u.summary) o += "    #[doc = \"\"]\n"; o += docs("    ", u.doc); } o += `    ${u.name} class r"${u.name}" {\n        rates [ ${u.rates.map(r => `(${r}, ${variant(r)})`).join(", ")} ]\n        fields [\n`; for (const f of builderFields(u)) { if (f.doc) o += docs("            ", f.doc); o += `            ${kind(f.kind)} ${f.ident}: ${ty(f.kind)} = ${f.init},\n`; } o += `        ]\n        outputs ( ${outputs(u)} )\n        push [ ${pushes(u).map(([k, f]) => `(${kind(k)} ${f})`).join(", ")} ]\n    }\n`; } return o + "}\n"; }
function buildersMod(s: Ugens): string { let o = header("ugens"); for (const c of s.categories) o += `pub mod ${c.name};\n`; o += "\n"; for (const c of s.categories) o += `pub use ${c.name}::*;\n`; return o; }
function wasm(s: Ugens): string { let o = header("ugens") + "sc_ugens_wasm! {\n", ts = ""; for (const c of s.categories) for (const u of c.ugens.filter(buildable)) { const fs = builderFields(u); o += `    class ${u.name} "${u.name}" :: ${u.name} {\n`; for (const r of u.rates) { o += `        ${r} {\n`; for (const f of fs) o += `            ${kind(f.kind)} ${f.ident} "${f.js}",\n`; o += "        }\n"; } o += "    }\n"; const args = fs.length ? `args?: { ${fs.map(f => `${f.js}?: ${f.kind === "input" ? "UGenInputLike" : f.kind === "inputArray" ? "UGenInputLike[]" : "number"}`).join("; ")} }` : "args?: Record<string, never>"; ts += `export class ${u.name} {\n  private constructor();\n`; for (const r of u.rates) ts += `  static ${r}(${args}): UGenInput;\n`; ts += "}\n"; } return o + `}\n\n#[wasm_bindgen(typescript_custom_section)]\nconst TS_BUILDERS: &'static str = ${raw(ts)};\n`; }
function envs(e: Envs): string { let o = header("envs") + `pub static ENV_SHAPES: [EnvShapeEntry; ${e.shapes.length}] = [\n`; for (const s of e.shapes) { o += `    EnvShapeEntry {\n        name: "${s.name}",\n        release_node: ${s.releaseNode === null ? "None" : `Some(${s.releaseNode})`},\n        loop_node: ${s.loopNode === null ? "None" : `Some(${s.loopNode})`},\n        args: &[\n`; for (const a of s.args) o += `            ${a.array ? `aarg("${a.name}", ${a.modulatable})` : a.modulatable ? `marg("${a.name}", ${f32(a.default)})` : `arg("${a.name}", ${f32(a.default)})`},\n`; o += "        ],\n    },\n"; } return o + "];\n"; }

/** Canonicalize through rustfmt (stdin — the @generated skip only applies
 *  to on-disk files) so the committed output always satisfies the repo's
 *  `cargo fmt --check` gate. */
function rustfmt(content: string, rel: string): string {
  const r = spawnSync("rustfmt", ["--edition", "2021", "--emit", "stdout"], { input: content, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`rustfmt failed for ${rel}: ${r.stderr}`);
  return r.stdout;
}

export function render(): Map<string, string> { const u = loadUgens(), e = loadEnvs(), m = new Map<string, string>(), base = "src-tauri/crates/scsynthdef-compiler/src"; for (const c of u.categories) { m.set(`${base}/specs/${c.name}.rs`, specCategory(c)); m.set(`${base}/builders/${c.name}.rs`, builderCategory(c)); } m.set(`${base}/specs/mod.rs`, specsMod(u)); m.set(`${base}/builders/mod.rs`, buildersMod(u)); m.set(`${base}/builders_wasm_gen.rs`, wasm(u)); m.set(`${base}/env_shapes.rs`, envs(e)); for (const [rel, content] of m) m.set(rel, rustfmt(content, rel)); return m; }
function main(): void { const args = process.argv.slice(2), check = args.includes("--check"); if (args.some(a => a !== "--check")) throw new Error(`unknown arguments: ${args.join(" ")}`); let drift = false; for (const [rel, content] of render()) { const path = resolve(ROOT, rel); if (check) { let actual: string | undefined; try { actual = readFileSync(path, "utf8"); } catch { actual = undefined; } if (actual !== content) { console.error(`generated file differs: ${rel}`); drift = true; } } else { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); console.log(rel); } } if (drift) process.exitCode = 1; }
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
