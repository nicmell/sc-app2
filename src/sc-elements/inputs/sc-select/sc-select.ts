// <sc-select> — a dropdown over its sc-option children, bound to a control/var
// (`bind:value` on the ScInput base). Renders the ui-components
// <sc-base-select>, projecting each sc-option's collected {value,label} into an
// <sc-base-option>. The sc-option children are pure data (consumed at parse,
// never enabled); the shared ScInput seam syncs the selection from the target's
// `_state` and dispatches the chosen value through commit().

import { ScChoiceInput } from "@/sc-elements/internal/sc-choice-input";
import "@sc-app/ui-components/lit";

export class ScSelect extends ScChoiceInput {
  protected get baseTag() {
    return "select" as const;
  }

  protected get optionTag() {
    return "option" as const;
  }

  protected get choicePlaceholder(): string | undefined {
    return this.getProp("placeholder") as string | undefined;
  }
}
