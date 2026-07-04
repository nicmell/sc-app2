// <sc-base-icon> — a Phosphor icon. Shadow DOM: renders an <i> whose glyph is
// addressed by CODEPOINT — `--ph-glyph` (+ `--ph-glyph-2` for duotone's front
// layer) feed the ::before/::after `content` in sc-icon.scss — looked up in the
// generated name → codepoint maps (./codepoints, one per weight). This keeps
// Phosphor's ~100 KB-per-weight `.ph-*` rule sheets out of the shadow CSSResult
// (the boot JS) and the head CSS alike; the fonts themselves are registered
// document-wide by the foundation's head <link> (foundations/icons.scss —
// @font-face is ignored inside a shadow root, so document registration is what
// paints the glyph). Colour follows currentColor and size follows the
// surrounding font-size (1em) unless a size token is given.
//
// `variant` selects the weight: regular (default) | fill | duotone.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import cx from "classnames";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-icon.scss";
import { DUOTONE, FILL, REGULAR } from "./codepoints";

export type ScIconSize = "sm" | "md" | "lg";
export type ScIconVariant = "regular" | "fill" | "duotone";

/** Phosphor weight → its base class (sc-icon.scss keys the font-family off it). */
const WEIGHT_CLASS: Record<ScIconVariant, string> = {
  regular: "ph",
  fill: "ph-fill",
  duotone: "ph-duotone",
};

/** A codepoint as a CSS <string> value for `content: var(…)`. */
const glyph = (code: number): string => `"${String.fromCodePoint(code)}"`;

export class ScIconBase extends LitElement {
  static styles = [resetStyles, styles];

  /** Phosphor icon name (kebab-case, without the `ph-` prefix), e.g. "play". */
  @property() accessor name = "";
  /** Weight: regular (default) | fill | duotone. */
  @property() accessor variant: ScIconVariant = "regular";
  /** Optional token-backed size (reflected → :host([size])); omit to inherit font-size. */
  @property({ reflect: true }) accessor size: ScIconSize | undefined = undefined;
  /** Accessible label. When omitted the icon is decorative (aria-hidden). */
  @property() accessor label = "";

  /** The custom properties carrying the glyph(s); empty for an unknown name
   *  (the icon renders blank, like an unmatched class used to). */
  private glyphProps(): Readonly<Record<string, string>> {
    if (this.variant === "duotone") {
      const codes = DUOTONE[this.name];
      if (!codes) return {};
      const props: Record<string, string> = { "--ph-glyph": glyph(codes[0]) };
      // Single-glyph duotone icons leave --ph-glyph-2 unset → no ::after box.
      if (codes.length > 1) props["--ph-glyph-2"] = glyph(codes[1]);
      return props;
    }
    const code = (this.variant === "fill" ? FILL : REGULAR)[this.name];
    return code === undefined ? {} : { "--ph-glyph": glyph(code) };
  }

  render() {
    const cls = cx(WEIGHT_CLASS[this.variant], `ph-${this.name}`);
    const style = styleMap(this.glyphProps());
    return this.label
      ? html`<i class=${cls} style=${style} role="img" aria-label=${this.label}></i>`
      : html`<i class=${cls} style=${style} aria-hidden="true"></i>`;
  }
}
