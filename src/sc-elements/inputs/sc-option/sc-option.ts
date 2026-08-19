// <sc-option> — one declarative choice inside an sc-select: pure data
// (`value`/`label`), collected by the parent at parse and projected into an
// <sc-base-option>. Consumed by the parent, never part of the live runtime.

import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScOption extends ScElement {}
