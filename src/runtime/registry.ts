// The global parsed-element registry: id → ScElementRuntime for every element
// the parse engine (sc-elements/internal ScElement hydrate/process) has
// produced. Deliberately NOT a slice of the app store — parsed trees are plain
// data the sc-* elements look themselves up in, not reactive UI state. A
// plugin registers its whole tree at parse time and unregisters it when the
// sc-plugin root unmounts.

import { isParentRuntime } from "@/lib/utils/guards";
import type { ScElementRuntime } from "@/types/runtime";

const nodes = new Map<string, ScElementRuntime>();

/** Adopt a processed plugin tree (the per-parse `nodes` map a successful
 *  root `process()` run produced). */
export function registerAll(tree: ReadonlyMap<string, ScElementRuntime>): void {
  for (const [id, item] of tree) nodes.set(id, item);
}

export function getById(id: string): ScElementRuntime | undefined {
  return nodes.get(id);
}

export function getByIdOrThrow(id: string): ScElementRuntime {
  const item = nodes.get(id);
  if (!item) throw new Error(`runtime registry: no element with id "${id}"`);
  return item;
}

/** Drop a parsed tree (the plugin root + every descendant) — plugin unmount. */
export function unregisterTree(rootId: string): void {
  const root = nodes.get(rootId);
  if (!root) return;
  const drop = (item: ScElementRuntime): void => {
    nodes.delete(item.id);
    if (isParentRuntime(item)) item.children.forEach(drop);
  };
  drop(root);
}
