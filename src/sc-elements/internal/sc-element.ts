// Minimal base for the parsed plugin elements (the old sc-app's ScElement,
// trimmed to the stub phase): light-DOM rendering and a lookup of the parsed
// item this element was hydrated into — no store subscription, no parent
// context yet.

import { LitElement } from "lit";
import { getById } from "@/runtime/registry";
import type { ScElementItem } from "@/types/parsers";

export abstract class ScElement<T extends ScElementItem = ScElementItem> extends LitElement {
  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement {
    return this;
  }

  /** The parsed item this element was hydrated into (`processHtml` assigns the
   *  matching DOM id), or `null` before the plugin root has parsed. */
  get item(): T | null {
    return (getById(this.id) as T | undefined) ?? null;
  }

  // TEST: the registry item's `_element` must be THIS mounted component
  // instance — i.e. the runtime registry gives access to the live web
  // component (and its methods) from outside the DOM. Deferred one task: the
  // first render races processHtml/registerAll in the same microtask queue.
  protected firstUpdated(): void {
    setTimeout(() => {
      const item = this.item;
      const el = item?._element;
      console.log(
        `[sc-element test] <${this.tagName.toLowerCase()} id="${this.id}">`,
        `registry._element === this: ${el === this}`,
        "| ctor:", el?.constructor.name ?? "(no item)",
        "| proto methods:", el ? Object.getOwnPropertyNames(Object.getPrototypeOf(el)) : null,
        "| _element:", el,
      );
    }, 0);
  }
}
