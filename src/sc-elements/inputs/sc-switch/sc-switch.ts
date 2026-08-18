// <sc-switch> — a toggle switch bound to a control/var (`bind:value`
// on the ScInput base). The switch sibling of sc-checkbox: the same 1/0 value
// seam, rendering the ui-components <sc-base-switch> (track + thumb) instead of
// the checkbox box. No `label` — sc-base-switch has none.

import { ScCheckedInput } from "@/sc-elements/internal/sc-checked-input";
import "@sc-app/ui-components/lit";

export class ScSwitch extends ScCheckedInput {
  protected get baseTag() {
    return "switch" as const;
  }
}
