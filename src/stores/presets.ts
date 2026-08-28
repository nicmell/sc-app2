// Per-box plugin presets: each box's persisted literal-state values (element
// content-hash id → value + debug path), harvested from the mounted host's
// runtime store by PluginHost and saved alongside the layout by the
// SessionManager; a remounting host is reseeded from its box's entry.

import { SliceName } from "@/constants/store";
import { appStore } from "./store";
import type { BoxPresets } from "@/types/api";

const store = appStore.slice(SliceName.PRESETS);

export const presets = store;

/** Replace the whole map (session restore — unconditional, like setLayout). */
export function setPresets(next: Record<string, BoxPresets>): void {
  store.set(next);
}

/** Replace one box's captured values (the mounted host's harvest). Writes
 *  only when the box is still in the layout with this exact plugin: a late
 *  async harvest (a store notification racing a removeBox unmount, or an old
 *  session's host outliving a session switch) must neither resurrect a
 *  pruned entry nor write across sessions. */
export function setBoxPresets(i: string, plugin: string, values: BoxPresets["values"]): void {
  const box = appStore.get().layout.find((b) => b.i === i);
  if (box?.plugin !== plugin) return;
  store.update((map) => ({ ...map, [i]: { plugin, values } }));
}

/** Drop a box's values (box removed, or reassigned to another plugin). */
export function removeBoxPresets(i: string): void {
  store.update((map) => {
    if (!(i in map)) return map;
    const next = { ...map };
    delete next[i];
    return next;
  });
}
