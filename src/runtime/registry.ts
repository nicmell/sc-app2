// The global parsed-element registry: id → ScElementItem for every element the
// plugin parser (lib/html processHtml) has hydrated. Deliberately NOT a slice
// of the app store — parsed trees are plain data the sc-* elements look
// themselves up in, not reactive UI state. A plugin registers its whole tree
// at parse time and unregisters it when the sc-plugin root unmounts.

import { isParent } from "@/lib/utils/guards";
import type { ScElementItem } from "@/types/parsers";

const nodes = new Map<string, ScElementItem>();

/** Adopt a processed plugin tree (the per-parse `nodes` map a successful
 *  `processHtml` run produced). */
export function registerAll(tree: ReadonlyMap<string, ScElementItem>): void {
  for (const [id, item] of tree) nodes.set(id, item);
}

export function getById(id: string): ScElementItem | undefined {
  return nodes.get(id);
}

export function getByIdOrThrow(id: string): ScElementItem {
  const item = nodes.get(id);
  if (!item) throw new Error(`runtime registry: no element with id "${id}"`);
  return item;
}

/** Drop a parsed tree (the plugin root + every descendant) — plugin unmount. */
export function unregisterTree(rootId: string): void {
  const root = nodes.get(rootId);
  if (!root) return;
  const drop = (item: ScElementItem): void => {
    nodes.delete(item.id);
    if (isParent(item)) item.children.forEach(drop);
  };
  drop(root);
}
