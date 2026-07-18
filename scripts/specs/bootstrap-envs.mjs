#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(root, "src-tauri/crates/scsynthdef-compiler/src/env_registry.rs");
const docPath = join(root, "scripts/scdoc/out/env-doc.json");
const out = join(root, "assets/specs/envs.json");
const text = readFileSync(source, "utf8");
const staticBody = text.match(/pub static ENV_SHAPES:[\s\S]*?= \[([\s\S]*?)\n\];/);
if (!staticBody) throw new Error("ENV_SHAPES static not found");
const docs = existsSync(docPath) ? JSON.parse(readFileSync(docPath, "utf8")).shapes ?? [] : [];
const docByShape = new Map(docs.map((d) => [d.name, d]));
const argDocName = { attack: "attackTime", decay: "decayTime", sustain: "sustainLevel", release: "releaseTime", peak: "peakLevel" };
const shapes = [];
const entryRe = /(?:((?:\s*\/\/\/[^\n]*\n)*))?\s*EnvShapeEntry \{([\s\S]*?)\n\s*\},/g;
for (let m; (m = entryRe.exec(staticBody[1]));) {
  const body = m[2], name = body.match(/name: "([^"]+)"/)?.[1];
  if (!name) throw new Error("env entry without name");
  const node = (key) => { const v = body.match(new RegExp(`${key}: (Some\\((-?\\d+)\\)|None)`)); return v?.[2] == null ? null : +v[2]; };
  const docShape = docByShape.get(name);
  const argDocs = new Map(Object.entries(docShape?.argDocs ?? {}));
  const args = [...body.matchAll(/\b(arg|marg|aarg)\("([^"]+)"\s*,\s*([^\)]+)\)/g)].map((a) => {
    const helper = a[1], arg = { name: a[2], default: helper === "aarg" ? 0 : Number(a[3]) };
    if (helper === "aarg") arg.array = true;
    if (helper === "marg" || (helper === "aarg" && a[3].trim() === "true")) arg.modulatable = true;
    const docName = argDocName[arg.name] ?? arg.name;
    const doc = argDocs.get(docName) ?? argDocs.get(arg.name);
    if (doc) arg.doc = doc;
    return arg;
  });
  const shape = { name, releaseNode: node("release_node"), loopNode: node("loop_node") };
  const sourceDoc = (m[1] ?? "").split("\n").map((l) => l.replace(/^\s*\/\/\/\s?/, "").trim()).filter(Boolean).join(" ");
  const shapeDoc = docShape?.doc || sourceDoc;
  if (shapeDoc) shape.doc = shapeDoc;
  shape.args = args;
  shapes.push(shape);
}
if (shapes.length !== 12) throw new Error(`env parity failed: ${shapes.length}/12 shapes`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ shapes }, null, 2) + "\n");
const flags = shapes.reduce((n, s) => { for (const a of s.args) { n.args++; if (a.array) n.array++; if (a.modulatable) n.modulatable++; } return n; }, { args: 0, array: 0, modulatable: 0 });
console.log(`Envs parity OK: shapes=${shapes.length}, args=${flags.args}, array=${flags.array}, modulatable=${flags.modulatable}; perShape=${shapes.map((s) => `${s.name}:${s.args.length}`).join(",")}`);
