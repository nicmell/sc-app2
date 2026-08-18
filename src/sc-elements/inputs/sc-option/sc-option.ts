// <sc-option> — one declarative choice inside an sc-select: pure data
// (`value`/`label`), collected by the parent at parse and projected into an
// <sc-base-option>. Consumed by the parent, never enabled.

import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScOption extends ScElement {
  /** Pure data — never part of the live runtime. */
  get enabled(): boolean {
    return false;
  }
}
