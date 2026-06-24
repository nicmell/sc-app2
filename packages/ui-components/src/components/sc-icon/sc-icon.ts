// <sc-icon-base> — a Phosphor icon. Shadow DOM: renders the icon-font <i> with the
// `<weight> ph-<name>` classes from @phosphor-icons/web. The font ships with the
// FOUNDATION (foundations/_icons.scss): the @font-face registers on the document and
// the `.ph-*` glyph rules ride into every shadow via `static styles` — so this
// element needs no font code of its own. Colour follows currentColor and size
// follows the surrounding font-size (1em) unless a size token is given.
//
// `variant` selects the weight: regular (default) | fill | duotone.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
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
  static styles = [foundations, styles];

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
