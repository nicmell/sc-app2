// Plugin CRUD against the Rust HTTP router (`/api/plugins…`). Always HTTP — even
// under Tauri we go through the bundled server (never Tauri IPC), via the
// `src/http` helpers (which resolve against the injected HTTP_BASE_URL). A
// plugin's entry is a validated XHTML doc rooted at `sc-plugin`; loading imports
// its children into the app-synthesized host. Display metadata lives in PluginInfo.

import { get, post, put, del } from "@/lib/http";
import type { PluginInfo } from "@/types/api";

const PLUGINS_BASE = "/api/plugins";

export async function listPlugins(): Promise<PluginInfo[]> {
  return (await get(PLUGINS_BASE)).json();
}

export async function addPlugin(file: File): Promise<PluginInfo> {
  const buf = await file.arrayBuffer();
  return addPluginBytes(new Uint8Array(buf));
}

export async function addPluginBytes(zip: Uint8Array): Promise<PluginInfo> {
  return (await post(PLUGINS_BASE, zip)).json();
}

export async function replacePlugin(id: string, zip: Uint8Array): Promise<PluginInfo> {
  return (await put(`${PLUGINS_BASE}/${id}`, zip)).json();
}

export async function removePlugin(id: string): Promise<void> {
  await del(`${PLUGINS_BASE}/${id}`);
}

/** Import an authored entry root's children into the app-synthesized runtime host. */
export function adoptEntry(host: HTMLElement, doc: Document): void {
  const root = doc.documentElement;
  if (root.localName !== "sc-plugin") {
    throw new Error(`plugin entry root must be <sc-plugin> (got <${root.localName}>)`);
  }
  host.replaceChildren(
    ...Array.from(root.children).map((child) => document.importNode(child, true)),
  );
}

/** Parse entry markup (XML — self-closing custom-element tags retain their
 *  authored structure) and merge its root's children into `host`. */
export function adoptEntryXml(host: HTMLElement, xml: string): void {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
  adoptEntry(host, doc);
}

/** Fetch a plugin's entry (XHTML) and merge it into `host`. */
export async function loadPluginInto(host: HTMLElement, plugin: PluginInfo): Promise<void> {
  const res = await get(`${PLUGINS_BASE}/${plugin.id}/${plugin.entry}`);
  adoptEntryXml(host, await res.text());
}
