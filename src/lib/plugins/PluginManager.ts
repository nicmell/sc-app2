// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `src/http` helpers (which resolve against the injected HTTP_BASE_URL). A
// plugin's entry is a validated XHTML doc rooted at `sc-plugin`; PluginHost loads
// that authored root through the main document, processes it while disconnected,
// then mounts it. Display metadata lives in PluginInfo.

import { get, post, del } from "@/lib/http";
import type { ScElement, ScPlugin } from "@/sc-elements";
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

/** Import and explicitly upgrade the authored plugin root while disconnected. */
export function importEntryRoot(doc: Document): ScPlugin {
  if (doc.documentElement.localName !== "sc-plugin") {
    throw new Error(
      `plugin entry root must be <sc-plugin> (got <${doc.documentElement.localName}>)`,
    );
  }
  const root = document.importNode(doc.documentElement, true) as ScPlugin;
  customElements.upgrade(root);
  return root;
}

/** Load and process an authored plugin root while it is disconnected. */
export async function loadPluginHost(plugin: PluginInfo, hostId: string): Promise<ScPlugin> {
  const res = await get(`${PLUGINS_BASE}/${plugin.id}/${plugin.entry}`);
  const doc = new DOMParser().parseFromString(await res.text(), "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
  }

  const host = importEntryRoot(doc);
  host.id = hostId;
  host.process({
    rootNode: host,
    nodes: new Set<ScElement>(),
    scope: [host],
    path: [],
  });
  return host;
}
