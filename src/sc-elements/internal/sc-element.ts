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
}
