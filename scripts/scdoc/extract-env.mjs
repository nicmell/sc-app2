// Fetch the SuperCollider `Env` doc and extract every class-method constructor
// into scripts/scdoc/out/env-doc.json, ENRICHED with documentation the same
// way the UGen crawl is: each shape carries its prose `doc` and per-argument
// `argDocs` (parsed from that constructor's own description + Arguments table —
// Env.html has one table per method, unlike a single-table UGen page).
// This is the reproducible form of the manual doc lookup that seeded the
// hand-authored env-registry.ts.
//
// Note: the release-node / loop-node INDICES are set inside each constructor's
// body, not its signature, so they are NOT extractable here — the registry
// (packages/synthdef-compiler/src/env-registry.ts) supplies those from the SC
// semantics. This script captures the parameter surface + docs.
//
// Run: node scripts/scdoc/extract-env.mjs

import {
  BASE,
  fetchCached,
  methodDescription,
  parseArgDocs,
  parseClassMethodSections,
  writeJson,
} from "./lib.mjs";

const html = await fetchCached(`${BASE}/Classes/Env.html`);

// Utility class-methods that aren't envelope shapes.
const NON_SHAPE = new Set(["newClear", "shapeNames", "shapeNumber"]);

const shapes = parseClassMethodSections(html)
  .filter((m) => m.args.length > 0 && !NON_SHAPE.has(m.method))
  .map((m) => {
    const argDocs = parseArgDocs(m.section); // this method's own table
    return {
      name: m.method,
      doc: methodDescription(m.section),
      args: m.args.map((a) => ({ name: a.name, default: a.default })),
      argDocs: Object.fromEntries(
        m.args.map((a) => [a.name, argDocs[a.name] ?? null]).filter(([, d]) => d),
      ),
    };
  });

const file = writeJson("env-doc.json", { source: `${BASE}/Classes/Env.html`, shapes });
console.log(`wrote ${file} — ${shapes.length} shapes: ${shapes.map((s) => s.name).join(", ")}`);
