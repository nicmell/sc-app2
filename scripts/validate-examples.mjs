// Example-plugin validation harness (documented in CLAUDE.md):
// for each example dir — zip → POST /api/plugins (the XSD/upload gate), then,
// if installed, an in-page probe over CDP: fetch the entry via the plugin API,
// XML-parse + importNode its body children into a connected <sc-plugin> host,
// and run the host's own hydrate() + process() — the runtime validation.
// Expected failures: bad-metadata / bad-entry-* / bad-asset-* at upload,
// the remaining bad-* fixtures at runtime (one resolveRuntime error path
// each — see examples/README.md). Anything else failing is a migration bug.
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const REPO = new URL("..", import.meta.url).pathname;
const API = "http://127.0.0.1:3000";
const EXPECT_UPLOAD_FAIL = new Set(["bad-metadata", "bad-entry-xhtml", "bad-entry-schema", "bad-asset-type", "bad-asset-mismatch"]);
const EXPECT_RUNTIME_FAIL = new Set([
  "bad-bindings", // duplicate name in scope (first of its several errors)
  "bad-node-bind", // bind path's node segment matches nothing
  "bad-synthdef-bind", // bind targets a synthdef (not a node)
  "bad-undeclared-control", // bound control not declared on the target node
  "bad-circular-bind", // mutual sc-var cycle
  "bad-unknown-synthdef", // sc-synth bind matches no synthdef
  "bad-run-bind", // sc-run bind matches no node
  "bad-ugen-input", // ugen input with neither bind nor value
  "bad-ugen-ref", // ugen input references an unknown name
]);

// CDP setup
const tabs = await (await fetch("http://127.0.0.1:9222/json/list")).json();
let tab = tabs.find((t) => t.url.startsWith("http://localhost:1420"));
if (!tab) tab = await (await fetch("http://127.0.0.1:9222/json/new?http://localhost:1420/", { method: "PUT" })).json();
const ws = await new Promise((res, rej) => { const s = new WebSocket(tab.webSocketDebuggerUrl); s.onopen = () => res(s); s.onerror = () => rej(new Error("cdp")); });
let seq = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
await send("Runtime.enable");
await new Promise((r) => setTimeout(r, 3000)); // app boot

const probeRuntime = (pluginId, entry) => evaluate(`(async () => {
  const res = await fetch("/api/plugins/${pluginId}/${entry}");
  const doc = new DOMParser().parseFromString(await res.text(), "text/xml");
  if (doc.querySelector("parsererror")) return "PARSE ERROR: " + doc.querySelector("parsererror").textContent.slice(0, 120);
  const host = document.createElement("sc-plugin");
  document.body.appendChild(host);
  host.replaceChildren(...[...doc.querySelector("body").children].map((c) => document.importNode(c, true)));
  try {
    host.hydrate("probe-" + Math.random().toString(36).slice(2));
    host.process({ rootId: host.id, nodes: new Map(), scope: [host], path: [] });
    return "PASS";
  } catch (e) {
    return "FAIL: " + e.message;
  } finally {
    host.remove();
  }
})()`);

const work = mkdtempSync(join(tmpdir(), "sc-examples-"));
// Examples live one level deep (examples/<category>/<plugin>), each marked by
// its metadata.json.
const dirs = [];
for (const cat of readdirSync(join(REPO, "examples"), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name)) {
  for (const plugin of readdirSync(join(REPO, "examples", cat)).filter((d) => !d.startsWith("."))) {
    if (existsSync(join(REPO, "examples", cat, plugin, "metadata.json"))) dirs.push(join(cat, plugin));
  }
}
const rows = [];
const uploadedIds = [];
const preinstalled = await (await fetch(`${API}/api/plugins`)).json();

for (const dir of dirs.sort()) {
  const name = basename(dir);
  const pre = preinstalled.find((p) => p.name === name || (name === "default-plugin" && p.name === "default-dashboard"));
  let id, entry, uploadNote;
  if (pre) {
    ({ id, entry } = pre);
    uploadNote = "pre-installed";
  } else {
    const zip = join(work, `${dir.replaceAll("/", "-")}.zip`);
    execSync(`cd ${REPO}/examples/${dir} && zip -q -r ${zip} .`);
    const resp = await fetch(`${API}/api/plugins`, { method: "POST", body: await (await import("node:fs/promises")).readFile(zip) });
    if (resp.status === 201) {
      const info = await resp.json();
      ({ id, entry } = info);
      uploadedIds.push(id);
      uploadNote = "201";
    } else {
      const msg = (await resp.text()).split("\n")[0].slice(0, 90);
      const expected = EXPECT_UPLOAD_FAIL.has(name);
      rows.push({ dir, upload: `${resp.status} ${expected ? "(expected)" : "*** UNEXPECTED ***"}`, runtime: "-", note: msg });
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
  rows.push({ dir, upload: uploadNote, runtime: (rt === "PASS" ? "PASS" : rt.slice(0, 90)) + (ok ? (expectedFail ? " (expected)" : "") : " *** UNEXPECTED ***"), note: "" });
}

// cleanup the plugins this run uploaded
for (const id of uploadedIds) {
  await fetch(`${API}/api/plugins/${id}`, { method: "DELETE" });
}

console.log("\n=== example validation report ===");
for (const r of rows) {
  console.log(`${r.dir.padEnd(32)} upload: ${String(r.upload).padEnd(28)} runtime: ${r.runtime}${r.note ? "  | " + r.note : ""}`);
}
const unexpected = rows.filter((r) => String(r.upload).includes("UNEXPECTED") || String(r.runtime).includes("UNEXPECTED"));
console.log(`\n${unexpected.length} unexpected result(s)`);
process.exit(unexpected.length ? 1 : 0);
