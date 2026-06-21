// <sc-icon-base> — a Phosphor icon. Shadow DOM: renders the icon-font <i> with
// the `ph-fill ph-<name>` classes from @phosphor-icons/web. Those glyph rules
// live in a document stylesheet, so the icon adopts them into its shadow via
// adoptIconFont() (a no-op where the font CSS isn't loaded — tests, headless).
// Colour follows currentColor and size follows the surrounding font-size (1em)
// unless a size token is given.
//
// Only the FILL weight is supported by design — to add more weights later,
// introduce a `weight` prop (regular → "ph", others → `ph-<weight>`) and have
// the host import the corresponding `@phosphor-icons/web/<weight>` CSS.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import { adoptIconFont } from "../internal/icon-font";
import { styles } from "./sc-icon.styles";

export type ScIconSize = "sm" | "md" | "lg";

export class ScIconBase extends LitElement {
  static styles = [foundations, styles];

  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Optional token-backed size; omit to inherit the surrounding font-size. */
  @property() accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  protected firstUpdated(): void {
    adoptIconFont(this.renderRoot as ShadowRoot);
  }

  render() {
    const cls = cx("root", "ph-fill", `ph-${this.name}`, this.size && this.size);
    return this.label
      ? html`<i class=${cls} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} aria-hidden="true"></i>`;
  }
}
