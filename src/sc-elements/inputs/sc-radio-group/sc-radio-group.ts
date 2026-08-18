// <sc-radio-group> — a radio set over its sc-radio children, bound to a
// control/var (`bind:value` on the ScInput base). Renders the
// ui-components <sc-base-radio-group>, projecting each sc-radio's collected
// {value,label} into an <sc-base-radio>. The sc-radio children are pure data
// (consumed at parse, never enabled); the shared ScInput seam syncs the
// selection from the target's `_state` and dispatches the chosen value.

import { ScChoiceInput } from "@/sc-elements/internal/sc-choice-input";
import "@sc-app/ui-components/lit";

export class ScRadioGroup extends ScChoiceInput {
  protected get baseTag() {
    return "radioGroup" as const;
  }

  protected get optionTag() {
    return "radio" as const;
  }

  protected get choiceOrientation(): string | undefined {
    return this.getProp("orientation") as string | undefined;
  }

  protected get choiceLabel(): string | undefined {
    return this.getProp("label") as string | undefined;
  }
}
