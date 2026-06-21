// Shared base for the graphical `-base` input widgets. These are UI-only
// ("dumb") controls — no OSC, no store, no bind logic. The owner of the value
// is whoever consumes them (a logical sc-element wrapper, or a React parent).
// See packages/ui-components/README for the styling model.
//
// Event model: each widget renders a hidden native <input> (`.sr-only`) under
// its visual overlay and lets that input's NATIVE `input`/`change` flow to
// consumers (who read `e.target.value` / `.checked`) — no CustomEvent. The
// container widgets (sc-select / sc-radio-group) coordinate declarative
// children via Lit context and dispatch a plain `change` from the host.
//
// Light DOM (createRenderRoot → this). Each widget imports its own scoped CSS
// module (`sc-<name>.module.css`, exposing `root` + parts + sizes) and passes
// that `styles` map to `widgetClasses()`, which joins the per-widget root + size
// with the SHARED accent/disabled classes from widget-base.module.css (composed
// across the boundary via the inherited `--_accent` custom property).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import widget from "./widget-base.module.css";

/** A CSS-module class map (`import styles from "./sc-x.module.css"`). */
export type Styles = Record<string, string>;

/** The shared accent/disabled classes (re-exported so widgets that build their
 *  own class list — radio/option, which read size/variant from context — can
 *  reach the same scoped accent + disabled locals). */
export const widgetShared = widget;

/** Token-backed size scale shared by every widget. */
export type ScSize = "sm" | "md" | "lg";

/** Token-backed colour variant — the single accent channel each widget tints. */
export type ScVariant = "primary" | "neutral" | "ok" | "warn" | "danger";

export abstract class ScWidgetBase extends LitElement {
  /** Size variant → the per-widget `styles[size]` (token-backed dimensions). */
  @property() accessor size: ScSize = "md";
  /** Colour variant → the shared `widget[variant]` accent (sets `--_accent`). */
  @property() accessor variant: ScVariant = "primary";
  /** Disabled affordance → the shared `widget.disabled` + `aria-disabled`.
   *  Reflected so host-only elements (the radio group) can be styled by
   *  `[disabled]`. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Form field name — forwarded to the widget's hidden native input so it
   *  submits like a normal form control (empty = unnamed, not submitted). */
  @property() accessor name = "";

  /** Render into the light DOM so the module CSS (injected globally) applies. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** Join the widget's own `root` + `size` (from its module) with the shared
   *  accent (`variant`) + `disabled` classes, plus any per-widget `extra`
   *  state modifiers. */
  protected widgetClasses(styles: Styles, extra?: Record<string, boolean>): string {
    return cx(
      styles.root,
      styles[this.size],
      widget[this.variant],
      { [widget.disabled]: this.disabled },
      extra,
    );
  }
}
