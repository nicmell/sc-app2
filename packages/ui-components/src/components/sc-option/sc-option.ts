// <sc-option-base> — a declarative option row and a ContextConsumer of its
// <sc-select-base>. Shadow DOM: selection comes from context (selected =
// ctx.value === value); clicking reports back via ctx.select. The derived
// `selected` + the effective `size` are materialised onto reflected props
// (willUpdate), so :host([selected]) / :host([size]) style the bare row.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextConsumer } from "@lit/context";
import { ScControlBase } from "../internal/sc-control/sc-control";
import { selectContext } from "../sc-select/sc-select";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-option.scss";

export class ScOptionBase extends ScControlBase {
  static styles = [foundations, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  /** Selected state, derived from the select's value → reflected so `:host([selected])`
      styles the row. Read-only in practice — the select owns the value. */
  @property({ type: Boolean, reflect: true }) accessor selected = false;

  #select = new ContextConsumer(this, { context: selectContext, subscribe: true });

  private _onClick = (): void => {
    if (!this.disabled) this.#select.value?.select(this.value);
  };

  // Materialise the context-derived state onto reflected props: selection drives
  // :host([selected]); the select is authoritative for size, so push it down so
  // the effective value drives :host([size]).
  protected willUpdate(): void {
    const ctx = this.#select.value;
    this.selected = ctx?.value === this.value;
    if (ctx) this.size = ctx.size;
  }

  render() {
    return html`
      <div role="option" aria-selected=${this.selected} @click=${this._onClick}>
        ${this.label}
      </div>
    `;
  }
}
