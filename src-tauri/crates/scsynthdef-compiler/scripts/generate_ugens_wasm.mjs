#!/usr/bin/env node
// Generate src/builders_wasm.rs — one #[wasm_bindgen] function per typed
// builder × rate, exposing the crate's 365 UGen builders over the wasm
// boundary — plus a typescript_custom_section with the precise signatures.
//
// Everything is scraped from the generated src/builders/*.rs structs (the
// canonical arg order, types and rate factories live there):
//     pub struct SinOsc { _rate: Rate, freq: UGenInput, phase: UGenInput }
//     impl SinOsc { pub fn ar() ... pub fn kr() ...; setters; build() }
// emits
//     #[wasm_bindgen(js_name = "sinOscAr", skip_typescript)]
//     pub fn sin_osc_ar(def, args: JsValue) -> Result<JsValue, JsError>
// taking one optional { field?: UGenInputLike, ... } object — absent fields
// keep the builder's registry-default seeds. Variadic Vec<UGenInput> fields
// take arrays; u32 fields (num_channels) take plain numbers.
//
// Run from the crate root: node scripts/generate_ugens_wasm.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CRATE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDERS_DIR = join(CRATE_ROOT, "src", "builders");
const OUT_PATH = join(CRATE_ROOT, "src", "builders_wasm.rs");

const snakeToCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascalToSnake = (s) =>
    s
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
        .toLowerCase();

// ── scrape the builder structs ──────────────────────────────────────────────
const builders = [];
for (const file of readdirSync(BUILDERS_DIR).filter((f) => f.endsWith(".rs") && f !== "mod.rs")) {
    const txt = readFileSync(join(BUILDERS_DIR, file), "utf8");
    const structRe = /pub struct (\w+) \{\n([\s\S]*?)\n\}/g;
    let m;
    while ((m = structRe.exec(txt)) !== null) {
        const name = m[1];
        const fields = [];
        for (const line of m[2].split("\n")) {
            const fm = line.match(/^\s*(?:pub )?(\w+): (UGenInput|Vec<UGenInput>|u32),\s*$/);
            if (!fm || fm[1] === "_rate") continue;
            fields.push({ name: fm[1], ty: fm[2] });
        }
        // Rates from the impl block's factories.
        const implStart = txt.indexOf(`impl ${name} {`);
        const implEnd = txt.indexOf("\n}", implStart);
        const implBody = txt.slice(implStart, implEnd);
        const rates = [...implBody.matchAll(/pub fn (ar|kr|ir)\(\) -> Self/g)].map((f) => f[1]);
        if (rates.length === 0) continue; // operator/abstract builders
        builders.push({ name, fields, rates });
    }
}
builders.sort((a, b) => a.name.localeCompare(b.name));

// ── emit ────────────────────────────────────────────────────────────────────
const rs = [];
const ts = [];
rs.push(
    "// @generated — DO NOT EDIT. Regenerate with scripts/generate_ugens_wasm.mjs",
    "//",
    "// The typed UGen builder surface over wasm: one function per builder ×",
    "// rate, delegating to the crate's typed builders (registry defaults come",
    "// from the builders' factory seeds). Signatures are declared precisely in",
    "// the typescript_custom_section at the bottom (every function here is",
    "// skip_typescript).",
    "",
    "#![allow(warnings)]",
    "",
    "use wasm_bindgen::prelude::*;",
    "",
    "use crate::builders;",
    "use crate::wasm::{input_from_js, input_to_js, WasmSynthDef};",
    "",
    "fn opt(args: &JsValue, key: &str) -> Option<JsValue> {",
    "    if args.is_undefined() || args.is_null() {",
    "        return None;",
    "    }",
    "    let v = js_sys::Reflect::get(args, &JsValue::from_str(key)).ok()?;",
    "    if v.is_undefined() { None } else { Some(v) }",
    "}",
    "",
    "fn inputs_from_js(v: &JsValue) -> Result<Vec<crate::UGenInput>, JsError> {",
    "    js_sys::Array::from(v)",
    "        .iter()",
    "        .map(|x| input_from_js(&x))",
    "        .collect()",
    "}",
    "",
);

let fnCount = 0;
for (const b of builders) {
    const snake = pascalToSnake(b.name);
    for (const rate of b.rates) {
        const fnSnake = `${snake}_${rate}`;
        const jsName = snakeToCamel(fnSnake);
        rs.push(`#[wasm_bindgen(js_name = "${jsName}", skip_typescript)]`);
        rs.push(
            `pub fn ${fnSnake}(def: &mut WasmSynthDef, args: JsValue) -> Result<JsValue, JsError> {`,
        );
        rs.push(`    let mut b = builders::${b.name}::${rate}();`);
        for (const f of b.fields) {
            const key = snakeToCamel(f.name);
            if (f.ty === "UGenInput") {
                rs.push(`    if let Some(v) = opt(&args, "${key}") {`);
                rs.push(`        b = b.${f.name}(input_from_js(&v)?);`);
                rs.push(`    }`);
            } else if (f.ty === "Vec<UGenInput>") {
                rs.push(`    if let Some(v) = opt(&args, "${key}") {`);
                rs.push(`        b = b.${f.name}(inputs_from_js(&v)?);`);
                rs.push(`    }`);
            } else {
                // u32 (num_channels-style)
                rs.push(`    if let Some(v) = opt(&args, "${key}") {`);
                rs.push(
                    `        b = b.${f.name}(v.as_f64().ok_or_else(|| JsError::new("${key}: expected a number"))? as u32);`,
                );
                rs.push(`    }`);
            }
        }
        rs.push(`    input_to_js(&b.build(&mut def.inner))`);
        rs.push(`}`);
        rs.push("");
        fnCount++;

        const tsFields = b.fields
            .map((f) => {
                const key = snakeToCamel(f.name);
                const ty =
                    f.ty === "UGenInput"
                        ? "UGenInputLike"
                        : f.ty === "Vec<UGenInput>"
                          ? "UGenInputLike[]"
                          : "number";
                return `${key}?: ${ty}`;
            })
            .join("; ");
        ts.push(
            b.fields.length > 0
                ? `export function ${jsName}(def: SynthDef, args?: { ${tsFields} }): UGenInput;`
                : `export function ${jsName}(def: SynthDef, args?: Record<string, never>): UGenInput;`,
        );
    }
}

rs.push("#[wasm_bindgen(typescript_custom_section)]");
rs.push("const TS_BUILDERS: &'static str = r#\"");
rs.push(...ts);
rs.push("\"#;");
rs.push("");

writeFileSync(OUT_PATH, rs.join("\n"));
console.log(`generated ${fnCount} builder fns for ${builders.length} ugens → ${OUT_PATH}`);
