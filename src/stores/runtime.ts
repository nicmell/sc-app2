// Live runtime values of the mounted plugins — a slice of the single app
// store, keyed plugin-root-id → control path ("s1.freq") → number. The
// elements wire themselves to it in the load pass: enabled sc-controls seed
// their declarative default and mirror the key into their `value` prop;
// inputs/displays subscribe through the control's `selectValue()`. The only
// OSC-dispatching write path is `ScControl.setValue` — writing the slice
// directly (presets, future propagation) updates every subscribed view
// without touching scsynth.

import { SliceName } from "@/constants/store";
import { appStore } from "./store";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";

const store = appStore.slice(SliceName.RUNTIME);

export const runtime = store;

/** Establish a key's default: written only when the key is absent, so a
 *  reload keeps user-moved values while fresh mounts get the attribute. */
export function seedRuntimeValue(pluginId: string, key: string, value: number): void {
  store.update((s) =>
    s[pluginId]?.[key] !== undefined
      ? s
      : { ...s, [pluginId]: { ...s[pluginId], [key]: value } },
  );
}

export function setRuntimeValue(pluginId: string, key: string, value: number): void {
  store.update((s) => ({ ...s, [pluginId]: { ...s[pluginId], [key]: value } }));
}

export function getRuntimeValue(pluginId: string, key: string): number | undefined {
  return store.get()[pluginId]?.[key];
}

/** A read-only view onto one runtime value — fires `undefined` when the
 *  plugin's map is dropped (subscribers ignore it). */
export function selectRuntimeValue(pluginId: string, key: string): ReadonlyStore<number | undefined> {
  return store.select((s) => s[pluginId]?.[key]);
}

/** Drop a whole plugin's map (unmount). */
export function dropPluginRuntime(pluginId: string): void {
  store.update((s) => {
    if (!(pluginId in s)) return s;
    const { [pluginId]: _dropped, ...rest } = s;
    return rest;
  });
}
