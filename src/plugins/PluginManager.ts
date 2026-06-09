// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `httpBase()` helper from env. A plugin's entry is a validated XHTML doc using
// our `sc-*` elements; loading just injects its body and lets the custom elements
// upgrade themselves (no runtime/bind pipeline).

import { httpBase } from "../env";

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

async function pluginsBase(): Promise<string> {
  return `${httpBase()}/api/plugins`;
}

export async function listPlugins(): Promise<PluginInfo[]> {
  const res = await fetch(await pluginsBase());
  if (!res.ok) throw new Error(`GET /api/plugins → ${res.status}`);
  return res.json();
}

export async function addPlugin(file: File): Promise<PluginInfo> {
  const buf = await file.arrayBuffer();
  const res = await fetch(await pluginsBase(), { method: "POST", body: new Uint8Array(buf) });
  if (!res.ok) {
    throw new Error((await res.text()) || `POST /api/plugins → ${res.status}`);
  }
  return res.json();
}

export async function removePlugin(id: string): Promise<void> {
  const res = await fetch(`${await pluginsBase()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error((await res.text()) || `DELETE → ${res.status}`)
  };
}

/** Fetch a plugin's entry HTML and mount its body into `host`. The `sc-*`
 *  custom elements upgrade on insertion. Plugins must use explicit closing tags
 *  (e.g. `<sc-scope></sc-scope>`) so HTML reparsing doesn't swallow siblings. */
export async function loadPluginInto(host: HTMLElement, plugin: PluginInfo): Promise<void> {
  const res = await fetch(`${await pluginsBase()}/${plugin.id}/${plugin.entry}`);
  if (!res.ok) throw new Error(`load plugin → ${res.status}`);
  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  host.innerHTML = doc.body?.innerHTML ?? "";
}
