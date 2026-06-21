// Shared base for the graphical `-base` input widgets. These are UI-only
// ("dumb") controls — no OSC, no store, no bind logic. The owner of the value
// is whoever consumes them (a logical sc-element wrapper, or a React parent).
// See packages/ui-components/README for the styling model.
//
// Shadow DOM (the uniform model): each widget renders its visual overlay over a
// hidden native <input> (`.sr-only`) inside the shadow root, and re-emits a
// composed `input`/`change` from the host (native events don't cross the shadow
// boundary) — consumers read `e.target.value` / `.checked` on the host. The
// container widgets (sc-select / sc-radio-group) coordinate declarative children
// via Lit context and dispatch a plain `change` from the host.
//
// Styling: each widget sets `static styles = [foundations, widgetStyles, styles]`
// and composes literal class names (the shadow scopes them) via widgetClasses():
// the per-widget `root` + `size` with the shared accent (`variant`) + `disabled`.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

/** Token-backed size scale shared by every widget. */
export type ScSize = "sm" | "md" | "lg";

/** Token-backed colour variant — the single accent channel each widget tints. */
export type ScVariant = "primary" | "neutral" | "ok" | "warn" | "danger";

export abstract class ScWidgetBase extends LitElement {
  /** Size variant → the per-widget `.{size}` class (token-backed dimensions). */
  @property() accessor size: ScSize = "md";
  /** Colour variant → the shared `.{variant}` accent (sets `--_accent`). */
  @property() accessor variant: ScVariant = "primary";
  /** Disabled affordance → the shared `.disabled` class + `aria-disabled`. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Form field name — forwarded to the widget's hidden native input. */
  @property() accessor name = "";

  /** Join the widget's `root` + `size` (its own styles) with the shared accent
   *  (`variant`) + `disabled` classes, plus any per-widget `extra` state. */
  protected widgetClasses(extra?: Record<string, boolean>): string {
    return cx("root", this.size, this.variant, { disabled: this.disabled }, extra);
  }
}
