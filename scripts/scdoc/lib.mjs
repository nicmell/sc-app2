// Shared helpers for the SCDoc (doc.sccode.org) scrapers. The SCDoc HTML is
// regular: class-method signatures render as
//   <h3 class='method-code'><span class='method-prefix'>Cls.</span>
//     <a class='method-name' name='*ar'>ar</a>(<span class='argstr'>freq: 440.0</span>, …)</h3>
// and the argument docs as a <table class='arguments'> of
//   <tr><td class='argumentname'>freq<td class='argumentdesc'><p>…
// The class list + categories come from the site's docmap.js.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export const BASE = "https://doc.sccode.org";
const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, ".cache");

/** Fetch a URL, caching the raw body on disk (reruns are offline + instant). */
export async function fetchCached(url) {
  mkdirSync(CACHE, { recursive: true });
  const file = resolve(CACHE, url.replace(/[^a-z0-9]/gi, "_"));
  if (existsSync(file)) return readFileSync(file, "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const body = await res.text();
  writeFileSync(file, body);
  return body;
}

/** Coerce an argstr default token → number | string | null (+ the raw text).
 *  "440.0" → 440; "'lin'" → "lin"; "[0, 1, 0]" → the raw array string;
 *  "nil"/absent → null. */
function parseDefault(raw) {
  if (raw === undefined) return { default: null, raw: null };
  const v = raw.trim();
  if (v === "" || v === "nil") return { default: null, raw: v || null };
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(v)) return { default: Number(v), raw: v };
  const unquoted = v.replace(/^'(.*)'$/, "$1").replace(/^"(.*)"$/, "$1");
  return { default: unquoted, raw: v };
}

const METHOD_RE =
  /<h3 class='method-code'>[\s\S]*?<a class='method-name' name='([^']+)'[^>]*>([^<]*)<\/a>((?:\([\s\S]*?\))?)<\/h3>/g;
const ARGSTR_RE = /<span class='argstr'>([\s\S]*?)<\/span>/g;

/** Parse every CLASS-method (name attr starts with `*`) signature on a page →
 *  [{ method, args: [{ name, default, raw }] }]. */
export function parseClassMethods(html) {
  const out = [];
  for (const m of html.matchAll(METHOD_RE)) {
    const [, nameAttr, label, argsBlock] = m;
    if (!nameAttr.startsWith("*")) continue; // class methods only
    const args = [];
    for (const a of argsBlock.matchAll(ARGSTR_RE)) {
      const span = a[1].trim();
      const colon = span.indexOf(":");
      const name = colon < 0 ? span : span.slice(0, colon).trim();
      const def = colon < 0 ? undefined : span.slice(colon + 1);
      args.push({ name, ...parseDefault(def) });
    }
    out.push({ method: label.trim(), args });
  }
  return out;
}

const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Parse the "Arguments:" table → { argName: description }. */
export function parseArgDocs(html) {
  const start = html.indexOf("<h4>Arguments:</h4>");
  if (start < 0) return {};
  const table = html.slice(start, html.indexOf("</table>", start));
  const docs = {};
  const rowRe =
    /<td class='argumentname'>([^<]*)<td class='argumentdesc'>([\s\S]*?)(?=<tr><td class='argumentname'>|$)/g;
  for (const r of table.matchAll(rowRe)) docs[r[1].trim()] = stripTags(r[2]);
  return docs;
}

/** Parse docmap.js → [{ path, name, categories, installed, summary }]. */
export function parseDocmap(js) {
  const entries = [];
  const entryRe = /"(Classes\/[^"]+)":\s*\{([\s\S]*?)\n\},/g;
  for (const m of js.matchAll(entryRe)) {
    const path = m[1];
    const body = m[2];
    const field = (key) => {
      const f = body.match(new RegExp(`'${key}':\\s*"([^"]*)"`));
      return f ? f[1] : "";
    };
    entries.push({
      path,
      name: path.replace(/^Classes\//, ""),
      categories: field("categories"),
      installed: field("installed"),
      summary: field("summary"),
    });
  }
  return entries;
}

/** true when any category token is under the top-level UGens tree. */
export function isUgenCategory(categories) {
  return categories.split(",").some((c) => c.trim().split(">")[0] === "UGens");
}

/** Run `fn` over `items` with a bounded concurrency pool. */
export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export const OUT = resolve(HERE, "out");
export function writeJson(name, data) {
  mkdirSync(OUT, { recursive: true });
  const file = resolve(OUT, name);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  return file;
}
