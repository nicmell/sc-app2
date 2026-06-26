// <sc-text-base> — the typography primitive. Shadow DOM: it renders a single
// semantic element — chosen by `as` (span by default; p / div / h1–h6) — wrapping a
// `<slot>` for the author's text/inline children. The tag is SEMANTIC ONLY (document
// outline / a11y / SEO): the look is entirely prop-driven, so `<sc-text as="h1">`
// renders an <h1> reset to the base type scale, sized via `size`/`weight`/etc.
//
// Like the rest of the library, the modifier props reflect to the host, so the styling
// hooks off `:host([size]) …` etc. (no `.root` class, no classnames). The rendered tag
// is the host's single shadow child, so the size/weight/tone/align/inline/truncate
// rules target `:host([attr]) > *`. Styling = the shared `foundations` + its own `styles`.

import { LitElement } from "lit";
import { html, literal } from "lit/static-html.js";
import { property } from "lit/decorators.js";
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

  /** The rendered semantic element — semantics only (not reflected; it's a structural
      input read at render, not a `:host([attr])` style hook). */
  @property() accessor as: ScTextAs = "span";
  // Modifier props reflect to the host → styled via `:host([attr]) > *` (sc-text.scss).
  @property({ reflect: true }) accessor size: ScTextSize = "md";
  @property({ reflect: true }) accessor weight: ScTextWeight = "regular";
  @property({ reflect: true }) accessor tone: ScTextTone = "default";
  @property({ reflect: true }) accessor font: ScTextFont = "sans";
  @property({ reflect: true }) accessor align: ScTextAlign = "start";
  /** Single-line clip with an ellipsis. */
  @property({ type: Boolean, reflect: true }) accessor truncate = false;
  /** Force inline flow (otherwise the tag's natural display applies: span inline, the rest block). */
  @property({ type: Boolean, reflect: true }) accessor inline = false;

  render() {
    const tag = TAGS[this.as] ?? TAGS.span;
    return html`<${tag}><slot></slot></${tag}>`;
  }
}
