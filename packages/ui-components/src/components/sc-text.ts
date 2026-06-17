// <sc-text-base> — the typography primitive. Shadow DOM: slots the author's
// text/inline children and styles the host off reflected attributes
// (size/weight/tone/font/align + truncate/inline → `:host([…])`); the inherited
// font properties flow into the slotted content. Owns its styles via Lit `css`
// (sc-text.styles.ts); tokens reach the shadow by inheritance from :root.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { textStyles } from "./sc-text.styles";

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

  static styles = [textStyles];

  render() {
    return html`<slot></slot>`;
  }
}
