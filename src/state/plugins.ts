// Installed-plugin registry, mirrored from the Rust router. A slice of the
// single app store (`store.ts`).
import { appStore } from "./store";
import {
  addPlugin,
  listPlugins,
  removePlugin,
  type PluginInfo,
} from "../plugins/PluginManager";

const store = appStore.slice("plugins");

export const plugins = store;

/** Re-fetch the installed plugins from the server. */
export async function refreshPlugins(): Promise<void> {
  store.set(await listPlugins());
}

/** Upload + install a plugin zip, then add it to the store. */
export async function uploadPlugin(file: File): Promise<PluginInfo> {
  const info = await addPlugin(file);
  store.update((list) => [...list.filter((p) => p.id !== info.id), info]);
  return info;
}

/** Remove a plugin server-side + from the store. */
export async function deletePlugin(id: string): Promise<void> {
  await removePlugin(id);
  store.update((list) => list.filter((p) => p.id !== id));
}
