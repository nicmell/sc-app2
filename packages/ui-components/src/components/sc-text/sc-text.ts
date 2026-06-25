// <sc-text-base> — the typography primitive. Shadow DOM: it renders a single
// semantic element — chosen by `as` (span by default; p / div / h1–h6) — carrying
// the size/weight/tone/font/align/truncate/inline modifier classes, wrapping a
// `<slot>` for the author's text/inline children. The tag is SEMANTIC ONLY (document
// outline / a11y / SEO): the look is entirely prop-driven, so `<sc-text as="h1">`
// renders an <h1> reset to the base type scale, sized via `size`/`weight`/etc. The
// defaults (md / regular / sans / default tone / start) add no modifier class.
// Styling = the shared `foundations` + its own `styles`.

import { LitElement } from "lit";
import { html, literal } from "lit/static-html.js";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-text.scss";

export type ScTextAs = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type ScTextSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ScTextWeight = "regular" | "medium" | "bold";
export type ScTextTone =
  | "default"
  | "dim"
  | "mute"
  | "faint"
  | "primary"
  | "ok"
  | "warn"
  | "error"
  | "info";
export type ScTextFont = "sans" | "mono";
export type ScTextAlign = "start" | "center" | "end";

// Fixed tag → static `literal` lookup. The render tag MUST come from this table,
// never from interpolating the raw `as` value (that would be an injection vector).
const TAGS: Record<ScTextAs, ReturnType<typeof literal>> = {
  span: literal`span`,
  p: literal`p`,
  div: literal`div`,
  h1: literal`h1`,
  h2: literal`h2`,
  h3: literal`h3`,
  h4: literal`h4`,
  h5: literal`h5`,
  h6: literal`h6`,
};

export class ScTextBase extends LitElement {
  static styles = [foundations, styles];

  /** The rendered semantic element — semantics only; the look comes from the props. */
  @property() accessor as: ScTextAs = "span";
  @property() accessor size: ScTextSize = "md";
  @property() accessor weight: ScTextWeight = "regular";
  @property() accessor tone: ScTextTone = "default";
  @property() accessor font: ScTextFont = "sans";
  @property() accessor align: ScTextAlign = "start";
  /** Single-line clip with an ellipsis. */
  @property({ type: Boolean }) accessor truncate = false;
  /** Force inline flow (otherwise the tag's natural display applies: span inline, the rest block). */
  @property({ type: Boolean }) accessor inline = false;

  render() {
    const tag = TAGS[this.as] ?? TAGS.span;
    // Defaults (md/regular/default/sans/start) add no modifier class.
    return html`<${tag}
      class=${cx(
        this.size !== "md" && this.size,
        this.weight !== "regular" && this.weight,
        this.tone !== "default" && this.tone,
        this.font !== "sans" && this.font,
        this.align !== "start" && this.align,
        this.truncate && "truncate",
        this.inline && "inline",
      )}
      ><slot></slot
    ></${tag}>`;
  }
}
