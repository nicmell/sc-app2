// <sc-icon-base> — a Phosphor icon. Shadow DOM: renders the icon-font <i> with the
// `<weight> ph-<name>` classes from @phosphor-icons/web. The Phosphor @font-face is
// registered document-wide by the foundation's head <link>; this element is the only one
// that renders a raw <i class="ph"> in its shadow, so it adopts `glyphs`
// (foundations/icons.scss — the `.ph-*` content rules) on top of the shared font-free
// `foundations` base. (icons.scss also carries an @font-face, but @font-face is ignored
// inside a shadow root — the document registration is what paints the glyph.) Colour
// follows currentColor and size follows the surrounding font-size (1em) unless a size
// token is given.
//
// `variant` selects the weight: regular (default) | fill | duotone.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import glyphs from "../../foundations/icons.scss";
import styles from "./sc-icon.scss";

export type ScIconSize = "sm" | "md" | "lg";
export type ScIconVariant = "regular" | "fill" | "duotone";

/** Phosphor weight → its base class (combined with `ph-<name>`). */
const WEIGHT_CLASS: Record<ScIconVariant, string> = {
  regular: "ph",
  fill: "ph-fill",
  duotone: "ph-duotone",
};

export class ScIconBase extends LitElement {
  static styles = [foundations, glyphs, styles];

  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Weight: regular (default) | fill | duotone. */
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
