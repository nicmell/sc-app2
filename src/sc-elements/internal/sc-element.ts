// Minimal base for the parsed plugin elements: light-DOM rendering, a lookup
// of the parsed item this element was hydrated into, and the per-element
// validation hook the parser calls during hydration. HTML attributes are NOT
// copied into the items — they live here, on the components, as reactive
// properties; the runtime reads them through `item._element`.

import { LitElement } from "lit";
import { ELEMENTS } from "@/constants/sc-elements";
import { getById } from "@/runtime/registry";
import type { ScElementRuntime } from "@/types/runtime";

const SC_ELEMENT_SELECTOR = Object.values(ELEMENTS).join(", ");

/** `run="false"` is the only falsy spelling (bare/`run="true"` mean running). */
export const runAttribute = {
  converter: { fromAttribute: (value: string | null) => value !== "false" },
};

export abstract class ScElement<T extends ScElementRuntime = ScElementRuntime> extends LitElement {
  /** Render into the light DOM so plugin markup children stay visible. */
  createRenderRoot(): HTMLElement {
    return this;
  }

  /** The parsed item this element was hydrated into (`processHtml` assigns the
   *  matching DOM id), or `null` before the plugin root has parsed. */
  get item(): T | null {
    return (getById(this.id) as T | undefined) ?? null;
  }

  /** Per-element attribute validation, called by the parser during hydration
   *  (`lib/html` hydrate) — a violation fails the whole plugin parse. The
   *  backend XSD validates structure at upload, but it does not enforce
   *  attribute requirements, so this is the real gate. Colocate the rules
   *  with the property declarations in each component. */
  validate(): void {}

  /** Throw a validation error in the canonical `<tag>: message` shape. */
  protected failValidation(message: string): never {
    throw new Error(`<${this.tagName.toLowerCase()}>: ${message}`);
  }

  /** Leaves must not nest other sc-* elements. (Plain DOM children are fine:
   *  an upgraded element has already rendered its own UI into itself.) */
  protected requireNoScChildren(): void {
    if (this.querySelector(SC_ELEMENT_SELECTOR)) this.failValidation("must not contain sc-* elements");
  }

  /** Require a non-empty reactive property (backing a required attribute). */
  protected requireProp(name: string, value: string): void {
    if (!value) this.failValidation(`missing required "${name}" attribute`);
  }

  /** Reject a numeric property whose attribute didn't parse as a number. */
  protected requireNumeric(name: string, value: number | undefined): void {
    if (value !== undefined && Number.isNaN(value)) {
      this.failValidation(`"${name}" attribute must be a number`);
    }
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
