// <sc-radio> — one declarative choice inside an sc-radio-group: pure data
// (`value`/`label`), collected by the parent at parse and projected into an
// <sc-base-radio>. Consumed by the parent, never part of the live runtime.

import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRadio extends ScElement {}
