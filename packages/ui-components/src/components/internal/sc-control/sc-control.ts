// Shared base for every `-base` input/control — the text fields (sc-input,
// sc-inputnumber, sc-textarea), the select, and the graphical widgets (checkbox,
// switch, radio, slider, knob, option, radio-group). These are UI-only ("dumb")
// controls — no OSC, no store, no bind logic. The owner of the value is whoever
// consumes them (a logical sc-element wrapper, or a React parent).
//
// It supplies the props every control shares — `size`, `disabled`, `name`. Both `size`
// and `disabled` reflect to the host, so each control styles itself via `:host([size])`
// / `:host([disabled])` (or, for the text fields, the native `:disabled` from
// controls.scss) — no `.root` class. Controls are single-accent (the primary colour) —
// there is no colour variant.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";

/** Token-backed size scale shared by every control. */
export type ScSize = "sm" | "md" | "lg";

export abstract class ScControlBase extends LitElement {
  /** Size → reflected to the host (token-backed dimensions via `:host([size])`). */
  @property({ reflect: true }) accessor size: ScSize = "md";
  /** Disabled affordance → reflected to the host (styled via `:host([disabled])`). */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Form field name — forwarded to the control's native input where it has one. */
  @property() accessor name = "";
}
