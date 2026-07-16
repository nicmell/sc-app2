// Installed-plugin registry, mirrored from the Rust router. A slice of the
// single app store (`store.ts`).
import { SliceName } from "@/constants/store";
import { buildPluginZip, type PluginMetadata } from "@/lib/plugins/buildPluginZip";
import {
  addPlugin,
  addPluginBytes,
  listPlugins,
  removePlugin,
  replacePlugin,
} from "@/lib/plugins/PluginManager";
import { appStore } from "./store";
import type { PluginInfo } from "@/types/api";

const store = appStore.slice(SliceName.PLUGINS);

export const plugins = store;

/** Re-fetch the installed plugins from the server. */
export async function refreshPlugins(): Promise<void> {
  store.set(await listPlugins());
}

/** Upload + install a plugin zip, then add it to the store. */
export async function uploadPlugin(file: File): Promise<PluginInfo> {
  const info = await addPlugin(file);
  store.update((list) => [
    ...list.filter((p) => p.id !== info.id && (p.name !== info.name || p.version !== info.version)),
    info,
  ]);
  return info;
}

/** Build + install a plugin zip, then add it to the store. */
export async function createPlugin(meta: PluginMetadata, entryXml: string): Promise<PluginInfo> {
  const info = await addPluginBytes(buildPluginZip(meta, entryXml));
  store.update((list) => [
    ...list.filter((p) => p.id !== info.id && (p.name !== info.name || p.version !== info.version)),
    info,
  ]);
  return info;
}

/** Build + replace a plugin zip, then update it in the store. */
export async function updatePlugin(
  id: string,
  meta: PluginMetadata,
  entryXml: string,
): Promise<PluginInfo> {
  const info = await replacePlugin(id, buildPluginZip(meta, entryXml));
  store.update((list) => list.map((plugin) => (plugin.id === id ? info : plugin)));
  return info;
}

/** Remove a plugin server-side + from the store. */
export async function deletePlugin(id: string): Promise<void> {
  await removePlugin(id);
  store.update((list) => list.filter((p) => p.id !== id));
}
