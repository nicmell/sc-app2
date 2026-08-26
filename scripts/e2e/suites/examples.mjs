// The examples suite (the old validate-examples harness, as a suite): for
// each packaged example zip — POST /api/plugins (the upload gate), then, if
// installed, an in-page probe: fetch the entry via the plugin API, pass it
// through the Vite-served parseEntry (the frontend wasm gate), and run its
// own processRoot() — the runtime validation. Expected failures:
// bad-metadata / bad-entry-* / bad-asset-* and the spec-gate fixtures at
// upload, the remaining bad-* fixtures at runtime (one resolveRuntime error
// path each — see examples/README.md). Anything else failing is a bug.
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findOrCreateTab, js } from "../cdp.mjs";
import { API, REPO } from "../stack.mjs";

const EXPECT_UPLOAD_FAIL = new Set([
  "bad-metadata",
  "bad-entry-xhtml",
  "bad-entry-schema",
  "bad-asset-type",
  "bad-asset-mismatch",
  "bad-name-syntax", // a dotted name forging another scope's store key (spec gate)
  "bad-runtime-conflict", // static and dynamic runtime props are mutually exclusive (spec gate)
  "bad-attr-multierror", // every attribute rule violated once — multi-error, one line each (spec gate)
  "bad-content-multierror", // strict-empty leaves, list min-occurs, membership (spec gate)
  "bad-namespace", // elements outside the XHTML namespace (spec gate)
]);
const EXPECT_RUNTIME_FAIL = new Set([
  "bad-bindings", // duplicate name in scope (first of its several errors)
  "bad-node-bind", // bind path's node segment matches nothing
  "bad-synthdef-bind", // bind targets a synthdef (not a node)
  "bad-undeclared-control", // bound control not declared on the target node
  "bad-circular-bind", // sc-var self-reference (the only cycle left)
  "bad-forward-ref", // bind target declared after its reference
  "bad-forward-state-ref", // same-scope state bound before its declaration
  "bad-synth-target", // sc-synth bind naming a non-synthdef element
  "bad-unknown-synthdef", // sc-synth bind matches no synthdef
  "bad-ugen-input", // ugen input with neither bind nor value
  "bad-ugen-ref", // ugen input references an unknown name
  "bad-if-shadow", // a name inside sc-if colliding with the enclosing scope
  "bad-param-bind", // runtime prop on a synthdef param position
]);

/** First line of the ApiError envelope message (raw-text fallback), capped. */
function uploadNote(text) {
  try {
    return String(JSON.parse(text).message).split("\n")[0].slice(0, 90);
  } catch {
    return text.split("\n")[0].slice(0, 90);
  }
}

export async function run({ attach }) {
  // Discover the EXPECTED set from the sources; a fixture whose zip failed
  // to package must fail loudly, not vanish from the report.
  const SOURCES = join(REPO, "examples", "plugins");
  const DIST = join(REPO, "examples", "dist");
  const names = [];
  for (const cat of readdirSync(SOURCES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)) {
    for (const plugin of readdirSync(join(SOURCES, cat)).filter((d) => !d.startsWith("."))) {
      if (existsSync(join(SOURCES, cat, plugin, "metadata.json"))) names.push(plugin);
    }
  }

  if (attach) {
    // add_plugin dedupes by name+version (an upload REPLACES the stored
    // copy), so attach runs are naturally idempotent — no cleanup pass, and
    // deleting our upload would delete a pre-existing synced plugin.
    console.log(
      "[e2e] attach mode: uploads land in the ATTACHED server's app root " +
        "(same-named plugins are replaced in place)",
    );
  }

  const tab = await findOrCreateTab();
  // Own readiness gate, independent of the boot suite: initValidator is
  // idempotent and retries after a rejected init, so this poll converges
  // regardless of what the page is showing.
  await tab.evaluate(`(async () => {
    const { initValidator } = await import("/src/lib/plugins/validate.ts");
    await initValidator();
  })()`);

  const rows = [];
  for (const name of names.sort()) {
    const zip = join(DIST, `${name}.zip`);
    if (!existsSync(zip)) {
      rows.push({ name, ok: false, detail: `missing ${zip} — packaging failed?` });
      continue;
    }
    const resp = await fetch(`${API}/api/plugins`, { method: "POST", body: await readFile(zip) });
    if (resp.status !== 201) {
      const expected = EXPECT_UPLOAD_FAIL.has(name);
      rows.push({
        name,
        ok: expected,
        detail: `upload: ${resp.status}${expected ? " (expected)" : ""} | ${uploadNote(await resp.text())}`,
      });
      continue;
    }
    const info = await resp.json();
    if (EXPECT_UPLOAD_FAIL.has(name)) {
      rows.push({ name, ok: false, detail: "upload: 201 — EXPECTED a 400" });
      continue;
    }
    // The load-bearing probe sequence: text/xml parse, authored root,
    // whole-root importNode + explicit upgrade while disconnected, then
    // processRoot (parseEntry owns the first half).
    const runtime = await tab.evaluate(`(async () => {
      const res = await fetch(${js(`/api/plugins/${info.id}/${info.entry}`)});
      const text = await res.text();
      try {
        const { parseEntry } = await import("/src/lib/plugins/PluginManager.ts");
        const host = parseEntry(text);
        host.processRoot();
        return "PASS";
      } catch (e) {
        return "FAIL: " + e.message;
      }
    })()`);
    const expectedFail = EXPECT_RUNTIME_FAIL.has(name);
    const ok = runtime === "PASS" ? !expectedFail : expectedFail;
    rows.push({
      name,
      ok,
      detail: `upload: 201 | runtime: ${runtime === "PASS" ? "PASS" : runtime.slice(0, 90)}${
        ok && expectedFail ? " (expected)" : ""
      }`,
    });
  }

  tab.close();
  return rows;
}
