// The global parsed-element registry: id → the live ScElement component for
// every element the parse engine (sc-elements/internal ScElement hydrate/
// process) has produced — the element IS its runtime, so the registry exposes
// props, runtime values, and methods from outside the DOM. Deliberately NOT a
// slice of the app store — parsed trees are not reactive UI state. A plugin
// registers its whole tree at parse time and unregisters it when the
// sc-plugin root unmounts.

import type { ScElement } from "@/sc-elements/internal/sc-element";

const nodes = new Map<string, ScElement>();

/** Adopt a processed plugin tree (the per-parse `nodes` map a successful
 *  root `process()` run produced). */
export function registerAll(tree: ReadonlyMap<string, ScElement>): void {
  for (const [id, el] of tree) nodes.set(id, el);
}

export function getById(id: string): ScElement | undefined {
  return nodes.get(id);
}

export function getByIdOrThrow(id: string): ScElement {
  const el = nodes.get(id);
  if (!el) throw new Error(`runtime registry: no element with id "${id}"`);
  return el;
}

/** Drop a parsed tree (the plugin root + every descendant) — plugin unmount. */
export function unregisterTree(rootId: string): void {
  const root = nodes.get(rootId);
  if (!root) return;
  const drop = (el: ScElement): void => {
    nodes.delete(el.id);
    el.scChildren?.forEach(drop);
  };
  drop(root);
}
