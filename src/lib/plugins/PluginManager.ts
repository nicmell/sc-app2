// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `src/http` helpers (which resolve against the injected HTTP_BASE_URL). A
// plugin's entry is a validated XHTML doc using our `sc-*` elements; loading
// just injects its body and lets the custom elements upgrade themselves (no
// runtime/bind pipeline).

import { get, post, del } from "@/lib/http";
import type { PluginInfo } from "@/types/api";

const PLUGINS_BASE = "/api/plugins";

export async function listPlugins(): Promise<PluginInfo[]> {
  return (await get(PLUGINS_BASE)).json();
}

export async function addPlugin(file: File): Promise<PluginInfo> {
  const buf = await file.arrayBuffer();
  return (await post(PLUGINS_BASE, new Uint8Array(buf))).json();
}

export async function removePlugin(id: string): Promise<void> {
  await del(`${PLUGINS_BASE}/${id}`);
}

/** Fetch a plugin's entry (XHTML) and mount its body children into `host`.
 *  Parsed as XML — entries are XHTML and use self-closing custom-element tags
 *  (`<sc-control …/>`), which an HTML re-parse would mis-nest — and adopted
 *  via importNode, so the markup never round-trips through innerHTML. The
 *  `sc-*` custom elements upgrade on insertion. */
export async function loadPluginInto(host: HTMLElement, plugin: PluginInfo): Promise<void> {
  const res = await get(`${PLUGINS_BASE}/${plugin.id}/${plugin.entry}`);
  const doc = new DOMParser().parseFromString(await res.text(), "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
  const body = doc.querySelector("body");
  if (!body) throw new Error("plugin entry has no <body>");
  host.replaceChildren(...Array.from(body.children).map((c) => document.importNode(c, true)));
}
