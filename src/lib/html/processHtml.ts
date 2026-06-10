// Parse a plugin's injected DOM into the typed element tree: `hydrate` assigns
// the item's id onto the (already upgraded) web component, runs the element's
// own `validate()` (the per-element attribute rules live on the components,
// next to their reactive property declarations), and ties the item to it;
// `processHtml` drives the runtime processor (src/runtime/handlers
// processElement) with a `visit` callback that walks the DOM for sc-* parser
// tags (recursing through plain HTML), hydrates each scope with fresh ids,
// rejects duplicate sibling names, and recurses with the cumulative scope for
// bind resolution. The HTML attributes are NOT copied into the items — the
// runtime reads them through `item._element`'s reactive properties.

import { isNodeType, isParentRuntime } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import { checkDuplicateNames, processElement, type RuntimeContext } from "@/runtime/handlers";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScElementRuntime, ScElementRuntimeBase, ScParentRuntime } from "@/types/parsers";

function* walkDom(el: Element): Generator<Element> {
  for (const child of Array.from(el.children)) {
    const tag = child.tagName.toLowerCase();
    if (isNodeType(tag)) {
      yield child;
    } else {
      yield* walkDom(child);
    }
  }
}

export function hydrate(id: string, element: Element): ScElementRuntimeBase {
  element.setAttribute("id", id);
  // The components own their attribute validation (sc-plugin, the synthesized
  // root, declares none). A violation fails the whole plugin parse.
  (element as Partial<ScElement>).validate?.();
  const item: ScElementRuntimeBase = { id, _element: element };
  if (isParentRuntime(item)) (item as ScParentRuntime).children = [];
  return item;
}

export type HtmlRuntimeContext = Omit<RuntimeContext, "visit">;

export function processHtml(args: HtmlRuntimeContext): ScElementRuntime {
  return processElement({
    ...args,
    visit(node: ScElementRuntimeBase): ScElementRuntime {
      const parent = node as ScParentRuntime;
      const elements = Array.from(walkDom(node._element));

      const name = (node._element as { name?: string }).name;
      const path = name ? [...args.path, name] : args.path;

      const scope = elements.map((el) => hydrate(randomId(), el));

      checkDuplicateNames(scope);

      const childScope = [...scope, ...args.scope];
      for (let j = 0; j < scope.length; j++) {
        processHtml({ ...args, tree: scope[j], scope: childScope, parentNode: parent, path });
      }

      return parent;
    },
  });
}
