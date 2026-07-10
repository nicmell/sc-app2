// <sc-base-col> — one cell in sc-base-row's 24-unit grid. Numeric placement
// props are constrained to the grid range before becoming private CSS custom
// properties; `flex` can opt a column into free-form flex sizing.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-col.scss";

const gridUnit = (value: number | undefined): number =>
  Math.min(24, Math.max(0, Math.trunc(value ?? 0)));

export class ScColBase extends LitElement {
  static styles = [resetStyles, styles];

  @property({ type: Number, reflect: true }) accessor span: number | undefined;
  @property({ type: Number, reflect: true }) accessor offset: number | undefined;
  @property({ type: Number, reflect: true }) accessor order: number | undefined;
  @property({ type: Number, reflect: true }) accessor push: number | undefined;
  @property({ type: Number, reflect: true }) accessor pull: number | undefined;
  @property({ reflect: true }) accessor flex: string | undefined;

  protected updated(): void {
    this.style.setProperty("--sc-col-span", String(gridUnit(this.span)));
    this.style.setProperty("--sc-col-offset", String(gridUnit(this.offset)));
    this.style.setProperty("--sc-col-order", String(Math.trunc(this.order ?? 0)));
    this.style.setProperty("--sc-col-push", String(gridUnit(this.push)));
    this.style.setProperty("--sc-col-pull", String(gridUnit(this.pull)));
    if (this.flex === undefined) this.style.removeProperty("--sc-col-flex");
    else this.style.setProperty("--sc-col-flex", this.flex);
  }

  render() {
    return html`<slot></slot>`;
  }
}
