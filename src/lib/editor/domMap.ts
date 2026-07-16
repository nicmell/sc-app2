import type { EditorDoc, ElementNode, NodeKey } from "./model";

export interface DomMap {
  byKey: Map<NodeKey, Element>;
  keyOf: WeakMap<Element, NodeKey>;
}

/** Build an ephemeral model-to-preview map without marking up the authored DOM. */
export function buildDomMap(host: HTMLElement, doc: EditorDoc): DomMap {
  const byKey = new Map<NodeKey, Element>();
  const keyOf = new WeakMap<Element, NodeKey>();
  let warned = false;

  const warn = () => {
    if (warned) return;
    warned = true;
    console.warn("Editor preview DOM does not match the editor document");
  };

  const walk = (element: Element, node: ElementNode): void => {
    if (element.localName !== node.tag) {
      warn();
      return;
    }

    byKey.set(node.key, element);
    keyOf.set(element, node.key);

    const modelChildren = node.children.filter(
      (child): child is ElementNode => child.kind === "element",
    );
    const domChildren = Array.from(element.children);
    if (modelChildren.length !== domChildren.length) {
      warn();
      return;
    }

    for (let index = 0; index < modelChildren.length; index += 1) {
      if (domChildren[index].localName !== modelChildren[index].tag) {
        warn();
        continue;
      }
      walk(domChildren[index], modelChildren[index]);
    }
  };

  walk(host, doc);
  return { byKey, keyOf };
}
