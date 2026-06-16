// Shared base for the graphical `-base` input widgets. These are UI-only
// ("dumb") controls — no OSC, no store, no bind logic. They render, take
// interaction, and emit a framework-agnostic `change` CustomEvent; the owner
// of the value is whoever consumes them (a logical sc-element wrapper, or a
// React parent). See packages/ui-components/README and the foundation CSS in
// foundations/components/sc-*.css for the class contract.
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

  /** Dispatch the framework-agnostic change signal. Numeric `value` everywhere
   *  (booleans emit 0/1) to match the number-keyed runtime the wrappers feed. */
  protected emit(value: number): void {
    this.dispatchEvent(
      new CustomEvent("change", { detail: { value }, bubbles: true, composed: true }),
    );
  }
}
