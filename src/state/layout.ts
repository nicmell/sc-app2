// Dashboard grid layout: which plugin sits in which cell, plus geometry. Held
// in a reactiveStore and persisted to localStorage so the dashboard survives
// reloads (the plugin registry itself is server-side; this is just placement).

import { createStore, type ReadonlyStore } from "../util/reactiveStore";

/** A grid cell: react-grid-layout geometry + the assigned plugin id. */
export interface BoxItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  plugin?: string;
}

const KEY = "sc.dashboard.layout";

function load(): BoxItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BoxItem[]) : [];
  } catch {
    return [];
  }
}

const store = createStore<BoxItem[]>(load());
store.subscribe((items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
});

export const layout: ReadonlyStore<BoxItem[]> = store;

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
