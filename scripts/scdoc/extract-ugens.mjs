// Crawl the SuperCollider UGen class docs (doc.sccode.org) and extract a
// registry — one entry per standard UGen with an ar/kr/ir class method —
// mirroring the shape of packages/synthdef-compiler's UGenRegistryEntry
// (name, rates, defaults). The class list + categories come from the site's
// docmap.js (the machine-readable index behind Browse.html#UGens); each class
// page provides the method signatures + defaults + arg docs.
//
// Source differs from the committed specs (which came from an Overtone dump),
// so expect differences — see scripts/scdoc/diff-ugens.ts.
//
// Run: node scripts/scdoc/extract-ugens.mjs

import {
  BASE,
  fetchCached,
  isUgenCategory,
  parseArgDocs,
  parseClassMethods,
  parseDocmap,
  pool,
  writeJson,
} from "./lib.mjs";

const RATE_METHODS = ["ar", "kr", "ir"];

const docmap = parseDocmap(await fetchCached(`${BASE}/docmap.js`));
const classes = docmap
  .filter((e) => e.installed === "standard" && isUgenCategory(e.categories))
  .sort((a, b) => (a.name < b.name ? -1 : 1));

console.log(`found ${classes.length} standard UGen-category classes; fetching…`);

let done = 0;
const parsed = await pool(classes, 8, async (cls) => {
  const html = await fetchCached(`${BASE}/${cls.path}.html`);
  if (++done % 50 === 0) console.log(`  …${done}/${classes.length}`);
  const methods = parseClassMethods(html);
  const rateMethods = methods.filter((m) => RATE_METHODS.includes(m.method));
  // Canonical arg list: prefer ar, then kr, then ir (they share the signature).
  const canon =
    rateMethods.find((m) => m.method === "ar") ??
    rateMethods.find((m) => m.method === "kr") ??
    rateMethods.find((m) => m.method === "ir");
  const argDocs = parseArgDocs(html);
  return {
    name: cls.name,
    categories: cls.categories,
    summary: cls.summary,
    rates: rateMethods.map((m) => m.method),
    defaults: canon ? canon.args.map((a) => ({ name: a.name, default: a.default })) : [],
    argDocs: canon
      ? Object.fromEntries(
          canon.args.map((a) => [a.name, argDocs[a.name] ?? null]).filter(([, d]) => d),
        )
      : {},
  };
});

// A UGen registry entry needs at least one rate constructor; base/abstract
// classes (UGen, MultiOutUGen, Filter, …) have none.
const ugens = parsed.filter((u) => u.rates.length > 0);
const abstract = parsed.filter((u) => u.rates.length === 0).map((u) => u.name);

const file = writeJson("ugens-doc.json", {
  source: `${BASE}/Browse.html#UGens (via docmap.js)`,
  count: ugens.length,
  ugens,
});
console.log(`wrote ${file} — ${ugens.length} UGens (${abstract.length} rate-less classes skipped)`);
