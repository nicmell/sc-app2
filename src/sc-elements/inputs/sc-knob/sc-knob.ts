// <sc-knob> — a rotary knob bound to a control/var (`bind:value` on the
// ScInput base — a plain path is writable, an expression is a read-only meter). The rotary sibling of sc-slider: same value seam, same
// forwarding, but it renders the ui-components <sc-base-knob> (dial visual,
// dominant-axis drag) instead of the slider. No `orientation` — a knob has none.

import { ScNumericInput } from "@/sc-elements/internal/sc-numeric-input";
import "@sc-app/ui-components/lit";

export class ScKnob extends ScNumericInput {
  protected get baseTag() {
    return "knob" as const;
  }
}
