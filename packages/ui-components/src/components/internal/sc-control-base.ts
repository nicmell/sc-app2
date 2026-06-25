// Shared base for every `-base` input/control — the text fields (sc-input,
// sc-inputnumber, sc-textarea), the select, and the graphical widgets (checkbox,
// switch, radio, slider, knob, option, radio-group). These are UI-only ("dumb")
// controls — no OSC, no store, no bind logic. The owner of the value is whoever
// consumes them (a logical sc-element wrapper, or a React parent).
//
// It supplies the props every control shares — `size`, `disabled`, `name` — plus the
// `controlClasses()` helper that joins the per-control `root` + `size`. Disabled
// reflects to the host and is styled via `:host([disabled])` in each control's own CSS
// (or, for the text fields, the native `:disabled` from controls.css). Controls are
// single-accent (the primary colour) — there is no colour variant.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

/** Token-backed size scale shared by every control. */
export type ScSize = "sm" | "md" | "lg";

export abstract class ScControlBase extends LitElement {
  /** Size → the per-control `.{size}` class (token-backed dimensions). */
  @property() accessor size: ScSize = "md";
  /** Disabled affordance → reflected to the host (styled via `:host([disabled])`). */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Form field name — forwarded to the control's native input where it has one. */
  @property() accessor name = "";

  /** Join the control's `root` + `size` (its own styles), plus any per-control `extra`
   *  state. Disabled is reflected to the host, not added here. */
  protected controlClasses(extra?: Record<string, boolean>): string {
    return cx("root", this.size, extra);
  }
}
