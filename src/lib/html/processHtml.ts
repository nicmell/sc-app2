// Thin facade over the components' own parse engine (sc-elements/internal
// ScElement): hydration, validation, and runtime resolution all live on the
// elements themselves — `hydrate` assigns the id + runs the element's
// `validate()`, `processHtml` kicks off the root's `process()` recursion
// (each parent walks its DOM for sc-* tags, hydrates the whole sibling scope
// first, then processes each child with the cumulative scope). Kept as the
// stable entry point for the validation harness (scripts/
// validate-examples.mjs) and any out-of-tree parse.

import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { RuntimeContext, ScElementRuntime, ScElementRuntimeBase } from "@/types/runtime";

export function hydrate(id: string, element: Element): ScElementRuntimeBase {
  return (element as ScElement).hydrate(id);
}

export function processHtml(args: RuntimeContext): ScElementRuntime {
  return (args.tree._element as ScElement).process(args);
}
