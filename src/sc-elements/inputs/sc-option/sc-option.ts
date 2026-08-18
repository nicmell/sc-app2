// <sc-option> — one declarative choice inside an sc-select: pure data
// (`value`/`label`), collected by the parent at parse and projected into an
// <sc-base-option>. Consumed by the parent, never enabled.

import { ScChoiceOption } from "@/sc-elements/internal/sc-choice-option";

export class ScOption extends ScChoiceOption {}
