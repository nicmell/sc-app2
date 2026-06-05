// Installed-plugin registry, mirrored in a reactiveStore from the Rust router.
import { createStore, type ReadonlyStore } from "../util/reactiveStore";
import {
  addPlugin,
  listPlugins,
  removePlugin,
  type PluginInfo,
} from "../lib/plugins/PluginManager";

const store = createStore<PluginInfo[]>([]);

export const plugins: ReadonlyStore<PluginInfo[]> = store;

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
