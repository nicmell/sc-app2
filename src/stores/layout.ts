// Dashboard grid layout: which plugin sits in which cell, plus geometry. A slice
// of the single app store (`store.ts`); the SessionManager restores it from the
// backend's saved session at boot and periodically saves it back.

import { SliceName } from "@/constants/store";
import { appStore } from "./store";
import { removeBoxPresets } from "./presets";
import type { BoxItem } from "@/types/stores";

const store = appStore.slice(SliceName.LAYOUT);

export const layout = store;

/** A short, collision-unlikely id for a fresh box. */
export function randomId(): string {
  return `box-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Replace the whole layout (geometry already merged with plugin ids). */
export function setLayout(items: BoxItem[]): void {
  store.set(items);
}

/** Append a new box (geometry + optional plugin). */
export function addBox(box: BoxItem): void {
  store.update((list) => [...list, box]);
}

export function removeBox(i: string): void {
  store.update((list) => list.filter((b) => b.i !== i));
  removeBoxPresets(i);
}

export function setBoxPlugin(i: string, plugin: string): void {
  const previous = store.get().find((b) => b.i === i)?.plugin;
  store.update((list) => list.map((b) => (b.i === i ? { ...b, plugin } : b)));
  // Stale values must not follow the box across plugins (re-picking the same
  // plugin keeps them — the mounted host doesn't remount).
  if (previous !== plugin) removeBoxPresets(i);
}
