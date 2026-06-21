// <sc-text-base> — the typography primitive. Shadow DOM: it renders a single
// `.root` element (with the size/weight/tone/font/align/truncate/inline modifier
// classes) wrapping a `<slot>` for the author's text/inline children. The
// defaults (md / regular / sans / default tone / start) are the base `.root`
// rule (no modifier). Styling = the shared `foundations` + its own `styles`.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import cx from "classnames";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-text.styles";

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

export class ScTextBase extends LitElement {
  static styles = [foundations, styles];

  @property() accessor size: ScTextSize = "md";
  @property() accessor weight: ScTextWeight = "regular";
  @property() accessor tone: ScTextTone = "default";
  @property() accessor font: ScTextFont = "sans";
  @property() accessor align: ScTextAlign = "start";
  /** Single-line clip with an ellipsis. */
  @property({ type: Boolean }) accessor truncate = false;
  /** Flow inline (default is a block). */
  @property({ type: Boolean }) accessor inline = false;

  render() {
    // Defaults (md/regular/default/sans/start) add no modifier class.
    return html`<span
      class=${cx(
        "root",
        this.size !== "md" && this.size,
        this.weight !== "regular" && this.weight,
        this.tone !== "default" && this.tone,
        this.font !== "sans" && this.font,
        this.align !== "start" && this.align,
        this.truncate && "truncate",
        this.inline && "inline",
      )}
      ><slot></slot
    ></span>`;
  }
}
