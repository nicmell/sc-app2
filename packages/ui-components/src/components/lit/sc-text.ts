// <sc-text-base> — the typography primitive. Light DOM and host-only: it
// renders NO template (LitElement's default render() returns noChange), so the
// author's text/inline children are preserved untouched. Styling is driven by
// reflected props → attribute selectors (foundations/components/sc-text.css),
// the same pattern as <sc-radio-group-base> — there's no inner element to carry
// a class, and reflecting avoids racing a host className. Maps to the type
// tokens: size/weight/tone/font/align (+ truncate/inline).

import { LitElement } from "lit";
import { property } from "lit/decorators.js";

export type ScTextSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ScTextWeight = "regular" | "medium" | "bold";
export type ScTextTone = "default" | "dim" | "mute" | "faint" | "primary" | "ok" | "warn" | "error" | "info";
export type ScTextFont = "sans" | "mono";
export type ScTextAlign = "start" | "center" | "end";

export class ScTextBase extends LitElement {
  @property({ reflect: true }) accessor size: ScTextSize = "md";
  @property({ reflect: true }) accessor weight: ScTextWeight = "regular";
  @property({ reflect: true }) accessor tone: ScTextTone = "default";
  @property({ reflect: true }) accessor font: ScTextFont = "sans";
  @property({ reflect: true }) accessor align: ScTextAlign = "start";
  /** Single-line clip with an ellipsis. */
  @property({ type: Boolean, reflect: true }) accessor truncate = false;
  /** Flow inline (default is a block). */
  @property({ type: Boolean, reflect: true }) accessor inline = false;

  /** Light DOM + no render() ⇒ the text children stay; styling is by attribute. */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
