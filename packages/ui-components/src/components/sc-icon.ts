// <sc-icon-base> — a Phosphor icon. Renders the icon-font <i> with the
// `ph-fill ph-<name>` classes. Shadow DOM: an icon font's class→glyph CSS
// doesn't cross the shadow boundary, so the Phosphor fill stylesheet is adopted
// into this element's shadow (so icons render standalone AND nested inside other
// shadow components like sc-button). The @font-face is still registered globally
// by the host's `import "@phosphor-icons/web/fill"` (fonts resolve at the
// document level). Colour follows currentColor; size inherits font-size (1em)
// unless a size token is given.
//
// Only the FILL weight is supported by design — to add more weights later,
// introduce a `weight` prop and adopt the matching `@phosphor-icons/web/<weight>`.

import { LitElement, html, unsafeCSS } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import phosphorFillCss from "@phosphor-icons/web/fill/style.css?inline";
import { iconStyles } from "./sc-icon.styles";

export type ScIconSize = "sm" | "md" | "lg";

export class ScIconBase extends LitElement {
  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Optional token-backed size; omit to inherit the surrounding font-size. */
  @property() accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  // The Phosphor glyph rules must live in the shadow (the font itself is
  // registered globally by the host's `@phosphor-icons/web/fill` import).
  static styles = [unsafeCSS(phosphorFillCss), iconStyles];

  render() {
    const cls = cx("sc-icon", "ph-fill", `ph-${this.name}`, {
      [`sc-icon--${this.size}`]: this.size,
    });
    return this.label
      ? html`<i class=${cls} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} aria-hidden="true"></i>`;
  }
}
