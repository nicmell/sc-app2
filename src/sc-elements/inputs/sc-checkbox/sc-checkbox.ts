// <sc-checkbox> — a checkbox bound to a control/var (`bind:value` on the
// ScInput base). Renders the ui-components <sc-base-checkbox>, forwarding
// its props. Checked maps to the value 1, unchecked to 0; the shared ScInput
// seam wires the load-pass subscription (syncFromState) and the write path
// (commit), reading the target through `_state`/`onStateChange`.

import { ScCheckedInput } from "@/sc-elements/internal/sc-checked-input";
import "@sc-app/ui-components/lit";

export class ScCheckbox extends ScCheckedInput {
  protected get baseTag() {
    return "checkbox" as const;
  }

  protected get widgetLabel(): string | undefined {
    return this.getProp("label") as string | undefined;
  }
}
