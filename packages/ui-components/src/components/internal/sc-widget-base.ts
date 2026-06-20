// Shared base for the graphical `-base` input widgets. These are UI-only
// ("dumb") controls — no OSC, no store, no bind logic. The owner of the value
// is whoever consumes them (a logical sc-element wrapper, or a React parent).
// See packages/ui-components/README and the foundation CSS in
// the co-located sc-*.css for the class contract.
//
// Event model: each widget renders a hidden native <input> (`.sr-only`) under
// its visual overlay and lets that input's NATIVE `input`/`change` flow to
// consumers (who read `e.target.value` / `.checked`) — no CustomEvent. The
// container widgets (sc-select / sc-radio-group) coordinate declarative
// children via Lit context and dispatch a plain `change` from the host.
//
// Light DOM (createRenderRoot → this) so the foundation's global classes style
// the rendered markup. Variant/size are enum props resolved to BEM-ish class
// names with `classnames` (block `sc-<name>`, modifier `sc-<name>--<variant>`),
// which deliberately replaces the foundation's older [data-variant] pattern.

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";

/** Token-backed size scale shared by every widget. */
export type ScSize = "sm" | "md" | "lg";

/** Token-backed colour variant — the single accent channel each widget tints. */
export type ScVariant = "primary" | "neutral" | "ok" | "warn" | "danger";

export abstract class ScWidgetBase extends LitElement {
  /** Size variant → `sc-<block>--{sm,md,lg}` (drives token-backed dimensions). */
  @property() accessor size: ScSize = "md";
  /** Colour variant → `sc-<block>--{primary,…}` (sets `--_accent`). */
  @property() accessor variant: ScVariant = "primary";
  /** Disabled affordance → `sc-<block>--disabled` + `aria-disabled`. Reflected
   *  so host-only elements (the radio group) can be styled by `[disabled]`. */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Form field name — forwarded to the widget's hidden native input so it
   *  submits like a normal form control (empty = unnamed, not submitted). */
  @property() accessor name = "";

  /** Render into the light DOM so the global foundation classes apply. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /** The shared `block + block--size + block--variant + block--disabled` list,
   *  plus any per-widget state modifiers passed in `extra`. */
  protected blockClasses(block: string, extra?: Record<string, boolean>): string {
    return cx(
      block,
      `${block}--${this.size}`,
      `${block}--${this.variant}`,
      { [`${block}--disabled`]: this.disabled },
      extra,
    );
  }
}
