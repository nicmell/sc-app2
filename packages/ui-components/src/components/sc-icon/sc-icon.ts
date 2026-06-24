// <sc-icon-base> — a Phosphor icon. Shadow DOM: renders the icon-font <i> with
// the `<weight> ph-<name>` classes from @phosphor-icons/web. Those glyph rules
// can't reach a shadow-root element from a document stylesheet, so the icon carries
// them in its own `static styles` (the `iconFont` CSSResult) right alongside the
// foundation — Lit adopts one shared sheet per class across every icon instance.
// Colour follows currentColor and size follows the surrounding font-size (1em)
// unless a size token is given.
//
// `variant` selects the weight: regular (default) | fill | duotone. All three are
// bundled by the package (in `iconFont`), so there's no host setup to do.

import { LitElement, html, unsafeCSS, type CSSResult } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-icon.scss";
import regular from "@phosphor-icons/web/regular/style.css?inline";
import fill from "@phosphor-icons/web/fill/style.css?inline";
import duotone from "@phosphor-icons/web/duotone/style.css?inline";

// The bundled Phosphor glyph rules (all three weights) as ONE CSSResult. The
// `.ph-*` selectors + @font-face can't reach a shadow-root element from a document
// stylesheet, so the icon carries them in its own `static styles` — Lit adopts one
// shared sheet per class across every instance. Each weight's CSS comes in as a
// string (`?inline`, kept external so the consuming app's Vite emits the woff2);
// the package bundles Phosphor (a regular dependency) at the fixed weights the
// `variant` prop supports, so there's no host setup to do.
const iconFont: CSSResult = unsafeCSS([regular, fill, duotone].join("\n"));

export type ScIconSize = "sm" | "md" | "lg";
export type ScIconVariant = "regular" | "fill" | "duotone";

/** Phosphor weight → its base class (combined with `ph-<name>`). */
const WEIGHT_CLASS: Record<ScIconVariant, string> = {
  regular: "ph",
  fill: "ph-fill",
  duotone: "ph-duotone",
};

export class ScIconBase extends LitElement {
  static styles = [foundations, iconFont, styles];

  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Weight: regular (default) | fill | duotone. Needs the matching font CSS. */
  @property() accessor variant: ScIconVariant = "regular";
  /** Optional token-backed size; omit to inherit the surrounding font-size. */
  @property() accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  render() {
    const cls = cx("root", WEIGHT_CLASS[this.variant], `ph-${this.name}`, this.size && this.size);
    return this.label
      ? html`<i class=${cls} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} aria-hidden="true"></i>`;
  }
}
