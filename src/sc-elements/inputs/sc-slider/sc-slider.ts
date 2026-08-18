// <sc-slider> — a slider bound to a control/var (`bind:value` on the ScInput
// base — a plain path is writable, an expression makes it a read-only meter). Renders the ui-components <sc-base-slider>, forwarding every
// slider prop; the value plumbing (drag/wheel/keyboard, quantise, composed
// input/change) lives in the base widget. The shared ScInput seam wires the
// load-pass subscription (syncFromState) and the write path (commit): reads
// come through the uniform `_state` + `onStateChange()` seam (literal or
// derived alike), writes go through the target's `setValue()`.

import { ScNumericInput } from "@/sc-elements/internal/sc-numeric-input";
import "@sc-app/ui-components/lit";

export class ScSlider extends ScNumericInput {
  protected get baseTag() {
    return "slider" as const;
  }

  protected get widgetOrientation(): string | undefined {
    return this.getProp("orientation") as string | undefined;
  }
}
