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

/** Replace geometry from a react-grid-layout callback, preserving `plugin`. */
export function syncGeometry(next: ReadonlyArray<{ i: string; x: number; y: number; w: number; h: number }>): void {
  const byId = new Map(store.get().map((b) => [b.i, b]));
  store.set(
    next.map(({ i, x, y, w, h }) => ({ plugin: byId.get(i)?.plugin, i, x, y, w, h })),
  );
}

export function addBox(): void {
  const items = store.get();
  const id = `box-${Date.now().toString(36)}`;
  // Drop a 4x3 cell at the next free row.
  const y = items.reduce((max, b) => Math.max(max, b.y + b.h), 0);
  store.update((list) => [...list, { i: id, x: 0, y, w: 4, h: 3 }]);
}

export function removeBox(i: string): void {
  store.update((list) => list.filter((b) => b.i !== i));
}

export function setBoxPlugin(i: string, plugin: string): void {
  store.update((list) => list.map((b) => (b.i === i ? { ...b, plugin } : b)));
}
