#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(root, "src-tauri/crates/scserver-commands/src/commands.rs");
const out = join(root, "assets/specs/server-commands.json");
const text = readFileSync(source, "utf8");
const excluded = new Set(["ScopeSubscribe", "ScopeUnsubscribe"]);
const ignored = new Set(["OtherMsg"]);
const tupleType = { i32: "i32", f32: "f32", ControlId: "controlId", NumericValue: "numericValue", ControlValue: "controlValue" };
function rustBlock(open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error("unclosed Rust block");
}
const joinedDocs = (lines) => lines.map((s) => s.replace(/^\s*\/\/\/\s?/, "").trim()).filter(Boolean).join(" ");
function formFor(field, impl) {
  const { name, type, attrs } = field;
  if (name === "completion_msg" && type === "Option<Vec<u8>>" && attrs.includes("serde_bytes")) return "completion";
  if (type === "Vec<u8>" && attrs.includes("serde_bytes")) return "blob";
  if (["i32", "f32", "String"].includes(type)) return { scalar: type === "String" ? "string" : type };
  const opt = type.match(/^Option<(i32|f32)>$/);
  if (opt) return { optionScalar: opt[1] };
  const list = type.match(/^Vec<(i32|String|ControlId)>$/);
  if (list) return { list: list[1] === "String" ? "string" : list[1] === "ControlId" ? "controlId" : "i32" };
  if (type === "Vec<OscArg>") return "variadic";
  const vector = type.match(/^Vec<\((.*)\)>$/);
  if (vector) {
    const nested = vector[1].match(/^(i32|ControlId),\s*Vec<(f32|NumericValue)>$/);
    if (nested) return { setnTail: { head: tupleType[nested[1]], values: tupleType[nested[2]] } };
    const parts = vector[1].split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.every((x) => tupleType[x])) return { tail: parts.map((x) => tupleType[x]) };
  }
  throw new Error(`${name}: cannot classify type ${type}`);
}
function validateEncoding(command, field, impl) {
  const form = field.form;
  const self = `self.${field.name}`;
  if (form === "completion" && (!impl.includes(`if let Some(v) = ${self}`) || !impl.includes("OscType::Blob(v)"))) throw new Error(`${command}.${field.name}: completion encoding not re-derived`);
  if (form === "blob" && (!impl.includes(self) || !impl.includes("OscType::Blob"))) throw new Error(`${command}.${field.name}: blob encoding not re-derived`);
  if (form === "variadic" && (!impl.includes(`${self}.into_iter()`) || !impl.includes("args.extend"))) throw new Error(`${command}.${field.name}: variadic encoding not re-derived`);
  if (form.setnTail && (!impl.includes(`${self} {`) || !impl.includes("len() as i32"))) throw new Error(`${command}.${field.name}: setnTail encoding not re-derived`);
  if (form.optionScalar && !impl.includes(`if let Some(v) = ${self}`)) throw new Error(`${command}.${field.name}: optional encoding not re-derived`);
  if ((form.scalar || form.list || form.tail) && !impl.includes(self)) throw new Error(`${command}.${field.name}: encoding does not reference field`);
}

const commands = [], formCounts = { unit: 0, scalar: 0, optionScalar: 0, completion: 0, blob: 0, list: 0, variadic: 0, tail: 0, setnTail: 0 };
const structRe = /^pub struct (\w+)\s*\{/gm;
for (let m; (m = structRe.exec(text));) {
  const name = m[1];
  if (excluded.has(name) || ignored.has(name)) continue;
  const open = text.indexOf("{", m.index), body = rustBlock(open);
  const implMarker = `impl ${name} {`, implAt = text.indexOf(implMarker, open);
  if (implAt < 0) continue;
  const impl = rustBlock(implAt + implMarker.length - 1);
  const address = impl.match(/OscMessage::with_args\(r"([^"]+)",\s*args\)/)?.[1];
  if (!address) continue;
  const prefix = text.slice(0, m.index).split("\n");
  let i = prefix.length - 1;
  while (i >= 0 && (prefix[i].trim().startsWith("#[") || prefix[i].trim() === "")) i--;
  const docLines = [];
  while (i >= 0 && prefix[i].trim().startsWith("///")) docLines.unshift(prefix[i--]);
  const doc = joinedDocs(docLines).replace(/\s*OSC address: `[^`]+`\s*$/, "").trim();
  const fields = [];
  let pendingDocs = [], pendingAttrs = [];
  for (const line of body.split("\n")) {
    if (line.trim().startsWith("///")) { pendingDocs.push(line); continue; }
    if (line.trim().startsWith("#[")) { pendingAttrs.push(line.trim()); continue; }
    const fm = line.match(/^\s*pub ((?:r#)?\w+):\s*(.+),\s*$/);
    if (fm) {
      const field = { name: fm[1].replace(/^r#/, ""), type: fm[2].trim(), attrs: pendingAttrs.join(" ") };
      field.form = formFor(field, impl);
      const fieldDoc = joinedDocs(pendingDocs); if (fieldDoc) field.doc = fieldDoc;
      validateEncoding(name, field, impl);
      delete field.type; delete field.attrs;
      fields.push(field); pendingDocs = []; pendingAttrs = [];
    } else if (line.trim()) { pendingDocs = []; pendingAttrs = []; }
  }
  const command = { address, struct: name }; if (doc) command.doc = doc; command.fields = fields;
  if (!fields.length) formCounts.unit++;
  for (const f of fields) formCounts[typeof f.form === "string" ? f.form : Object.keys(f.form)[0]]++;
  commands.push(command);
}
if (commands.length !== 64) throw new Error(`command parity failed: ${commands.length}/64 (${commands.map((c) => c.struct).join(", ")})`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ commands }, null, 2) + "\n");
const tailShapes = new Set(commands.flatMap((c) => c.fields.filter((f) => f.form.tail).map((f) => JSON.stringify(f.form.tail))));
console.log(`Commands parity OK: commands=${commands.length}, forms=${JSON.stringify(formCounts)}, uniqueTailShapes=${tailShapes.size}`);
