// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `src/http` helpers (which resolve against the injected HTTP_BASE_URL). A
// plugin's entry is a validated XHTML doc using our `sc-*` elements; loading
// just injects its body and lets the custom elements upgrade themselves (no
// runtime/bind pipeline).

import { get, post, del } from "@/lib/http";

export interface PluginAsset {
  path: string;
  type: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  author: string;
  version: string;
  entry: string;
  assets: PluginAsset[];
}

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

/** Fetch a plugin's entry HTML and mount its body into `host`. The `sc-*`
 *  custom elements upgrade on insertion. Plugins must use explicit closing tags
 *  (e.g. `<sc-scope></sc-scope>`) so HTML reparsing doesn't swallow siblings. */
export async function loadPluginInto(host: HTMLElement, plugin: PluginInfo): Promise<void> {
  const res = await get(`${PLUGINS_BASE}/${plugin.id}/${plugin.entry}`);
  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  host.innerHTML = doc.body?.innerHTML ?? "";
}
