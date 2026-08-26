// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `src/http` helpers (which resolve against the injected HTTP_BASE_URL). Static
// entry validation is the shared Rust gate compiled to wasm for the frontend;
// `parseEntry` validates, imports, and upgrades the authored XHTML root while
// disconnected, then PluginHost processes and mounts it. Display metadata lives
// in PluginInfo.

import { get, post, del } from "@/lib/http";
import { validateEntry } from "@/lib/plugins/validate";
import type { ScPlugin } from "@/sc-elements";
import type { PluginInfo } from "@/types/api";

const PLUGINS_BASE = "/api/plugins";

export async function listPlugins(): Promise<PluginInfo[]> {
  return (await get(PLUGINS_BASE)).json();
}

export async function addPlugin(file: File): Promise<PluginInfo> {
  const buf = await file.arrayBuffer();
  // PluginList's violations Alert is the dedicated error surface.
  return (await post(PLUGINS_BASE, new Uint8Array(buf), { notify: false })).json();
}

export async function removePlugin(id: string): Promise<void> {
  await del(`${PLUGINS_BASE}/${id}`);
}

/** Parse, import, and explicitly upgrade an authored plugin root while disconnected. */
export function parseEntry(text: string): ScPlugin {
  const el = validateEntry(text);
  const root = document.importNode(el as ScPlugin, true);
  customElements.upgrade(root);
  return root;
}

/** Load and process an authored plugin root while it is disconnected. */
export async function loadPluginHost(plugin: PluginInfo): Promise<ScPlugin> {
  // PluginHost's inline error is the dedicated surface (N broken boxes must
  // not each stack a toast).
  const res = await get(`${PLUGINS_BASE}/${plugin.id}/${plugin.entry}`, { notify: false });
  const host = parseEntry(await res.text());
  host.processRoot();
  return host;
}
