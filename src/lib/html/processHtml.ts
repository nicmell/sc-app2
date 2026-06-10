// Parse a plugin's injected DOM into the typed element tree (ported from the
// old sc-app): `hydrate` validates + extracts each element's attributes
// (handlers.ts) and ties the item to its DOM node; `processHtml` drives the
// runtime processor (src/runtime/handlers processElement) with a `visit`
// callback that walks the DOM for sc-* parser tags (recursing through plain
// HTML), hydrates each scope with fresh ids, rejects duplicate sibling names,
// and recurses with the cumulative scope for bind resolution.

import { isNodeType } from "@/lib/utils/guards";
import { randomId } from "@/lib/utils/randomId";
import { checkDuplicateNames, processElement, type RuntimeContext } from "@/runtime/handlers";
import type { NodeType, ScElementItem, ScElementItemBase, ScParentItem } from "@/types/parsers";
import { extractProps } from "./handlers";

function tagToType(tag: string): NodeType {
  return tag as NodeType;
}

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

export function hydrate(
  node: { id: string; type: string; [key: string]: unknown },
  element: Element,
): ScElementItemBase {
  element.setAttribute("id", node.id);
  const props = extractProps(node.type, element);
  return Object.assign(node, props, { _element: element }) as ScElementItemBase;
}

export type HtmlRuntimeContext = Omit<RuntimeContext, "visit">;

export function processHtml(args: HtmlRuntimeContext): ScElementItem {
  return processElement({
    ...args,
    visit(node: ScElementItemBase): ScElementItem {
      const parent = node as ScParentItem;
      const elements = Array.from(walkDom(node._element!));

      const path = "name" in node && node.name ? [...args.path, node.name as string] : args.path;

      const scope = elements.map((el) => {
        return hydrate({ id: randomId(), type: tagToType(el.tagName.toLowerCase()) }, el);
      });

      checkDuplicateNames(scope);

      const childScope = [...scope, ...args.scope];
      for (let j = 0; j < scope.length; j++) {
        processHtml({ ...args, tree: scope[j], scope: childScope, parentNode: parent, path });
      }

      return parent;
    },
  });
}
