// <sc-icon-base> — a Phosphor icon. Shadow DOM: renders the icon-font <i> with
// the `<weight> ph-<name>` classes from @phosphor-icons/web. Those glyph rules
// live in document stylesheets, so the icon adopts them into its shadow via
// adoptIconFont() (a no-op where the font CSS isn't loaded — tests, headless).
// Colour follows currentColor and size follows the surrounding font-size (1em)
// unless a size token is given.
//
// `variant` selects the weight: regular (default) | fill | duotone. All three
// are bundled by the package (adopted into the icon's shadow by adoptIconFont),
// so there's no host setup to do.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import { adoptIconFont } from "../internal/icon-font";
import { styles } from "./sc-icon.styles";

export type ScIconSize = "sm" | "md" | "lg";
export type ScIconVariant = "regular" | "fill" | "duotone";

/** Phosphor weight → its base class (combined with `ph-<name>`). */
const WEIGHT_CLASS: Record<ScIconVariant, string> = {
  regular: "ph",
  fill: "ph-fill",
  duotone: "ph-duotone",
};

export class ScIconBase extends LitElement {
  static styles = [foundations, styles];

  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Weight: regular (default) | fill | duotone. Needs the matching font CSS. */
  @property() accessor variant: ScIconVariant = "regular";
  /** Optional token-backed size; omit to inherit the surrounding font-size. */
  @property() accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  protected firstUpdated(): void {
    adoptIconFont(this.renderRoot as ShadowRoot);
  }

  render() {
    const cls = cx("root", WEIGHT_CLASS[this.variant], `ph-${this.name}`, this.size && this.size);
    return this.label
      ? html`<i class=${cls} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} aria-hidden="true"></i>`;
  }
}
