// Example-plugin validation harness (documented in CLAUDE.md):
// for each example dir — zip → POST /api/plugins (the upload gate), then,
// if installed, an in-page probe over CDP: fetch the entry via the plugin API,
// pass it through the Vite-served parseEntry (the frontend wasm gate), and run
// its own processRoot() — the runtime validation.
// Expected failures: bad-metadata / bad-entry-* / bad-asset-* at upload,
// the remaining bad-* fixtures at runtime (one resolveRuntime error path
// each — see examples/README.md). Anything else failing is a migration bug.
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const REPO = new URL("..", import.meta.url).pathname;
const API = "http://127.0.0.1:3000";
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

// CDP setup
const tabs = await (await fetch("http://127.0.0.1:9222/json/list")).json();
let tab = tabs.find((t) => t.url.startsWith("http://localhost:1420"));
if (!tab)
  tab = await (
    await fetch("http://127.0.0.1:9222/json/new?http://localhost:1420/", { method: "PUT" })
  ).json();
const ws = await new Promise((res, rej) => {
  const s = new WebSocket(tab.webSocketDebuggerUrl);
  s.onopen = () => res(s);
  s.onerror = () => rej(new Error("cdp"));
});
let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) p.reject(new Error(JSON.stringify(m.error)));
    else p.resolve(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))
    .result.value;
await send("Runtime.enable");
await new Promise((r) => setTimeout(r, 3000)); // app boot

const probeRuntime = (pluginId, entry) =>
  evaluate(`(async () => {
  const res = await fetch("/api/plugins/${pluginId}/${entry}");
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

const work = mkdtempSync(join(tmpdir(), "sc-examples-"));
// Examples live one level deep (examples/<category>/<plugin>), each marked by
// its metadata.json.
const dirs = [];
for (const cat of readdirSync(join(REPO, "examples"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("."))
  .map((d) => d.name)) {
  for (const plugin of readdirSync(join(REPO, "examples", cat)).filter((d) => !d.startsWith("."))) {
    if (existsSync(join(REPO, "examples", cat, plugin, "metadata.json")))
      dirs.push(join(cat, plugin));
  }
}
const rows = [];
const uploadedIds = [];
const preinstalled = await (await fetch(`${API}/api/plugins`)).json();

for (const dir of dirs.sort()) {
  const name = basename(dir);
  const pre = preinstalled.find(
    (p) => p.name === name || (name === "default-plugin" && p.name === "default-dashboard"),
  );
  let id, entry, uploadNote;
  if (pre) {
    ({ id, entry } = pre);
    uploadNote = "pre-installed";
  } else {
    const zip = join(work, `${dir.replaceAll("/", "-")}.zip`);
    execSync(`cd ${REPO}/examples/${dir} && zip -q -r ${zip} .`);
    const resp = await fetch(`${API}/api/plugins`, {
      method: "POST",
      body: await (await import("node:fs/promises")).readFile(zip),
    });
    if (resp.status === 201) {
      const info = await resp.json();
      ({ id, entry } = info);
      uploadedIds.push(id);
      uploadNote = "201";
    } else {
      const text = await resp.text();
      let msg;
      try {
        msg = String(JSON.parse(text).message).split("\n")[0].slice(0, 90);
      } catch {
        msg = text.split("\n")[0].slice(0, 90);
      }
      const expected = EXPECT_UPLOAD_FAIL.has(name);
      rows.push({
        dir,
        upload: `${resp.status} ${expected ? "(expected)" : "*** UNEXPECTED ***"}`,
        runtime: "-",
        note: msg,
      });
      continue;
    }
  }
  if (EXPECT_UPLOAD_FAIL.has(name)) {
    rows.push({ dir, upload: `${uploadNote} *** EXPECTED 400 ***`, runtime: "-", note: "" });
    continue;
  }
  const rt = await probeRuntime(id, entry);
  const expectedFail = EXPECT_RUNTIME_FAIL.has(name);
  const ok = rt === "PASS" ? !expectedFail : expectedFail;
  rows.push({
    dir,
    upload: uploadNote,
    runtime:
      (rt === "PASS" ? "PASS" : rt.slice(0, 90)) +
      (ok ? (expectedFail ? " (expected)" : "") : " *** UNEXPECTED ***"),
    note: "",
  });
}

// cleanup the plugins this run uploaded
for (const id of uploadedIds) {
  await fetch(`${API}/api/plugins/${id}`, { method: "DELETE" });
}

console.log("\n=== example validation report ===");
for (const r of rows) {
  console.log(
    `${r.dir.padEnd(32)} upload: ${String(r.upload).padEnd(28)} runtime: ${r.runtime}${r.note ? "  | " + r.note : ""}`,
  );
}
const unexpected = rows.filter(
  (r) => String(r.upload).includes("UNEXPECTED") || String(r.runtime).includes("UNEXPECTED"),
);
console.log(`\n${unexpected.length} unexpected result(s)`);
process.exit(unexpected.length ? 1 : 0);
