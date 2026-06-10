// Dashboard grid layout: which plugin sits in which cell, plus geometry. A slice
// of the single app store (`store.ts`); the SessionManager restores it from the
// backend's saved session at boot and periodically saves it back.

import { appStore } from "./store";

/** A grid cell: react-grid-layout geometry + the assigned plugin id. */
export interface BoxItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  plugin?: string;
}

const store = appStore.slice("layout");

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
}

export function setBoxPlugin(i: string, plugin: string): void {
  store.update((list) => list.map((b) => (b.i === i ? { ...b, plugin } : b)));
}
