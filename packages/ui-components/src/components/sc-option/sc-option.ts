// <sc-option-base> — a declarative option row and a ContextConsumer of its
// <sc-select-base>. Shadow DOM: selection comes from context (selected =
// ctx.value === value); clicking reports back via ctx.select. Size flows through
// the context, applied as a class in the option's own shadow.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextConsumer } from "@lit/context";
import cx from "classnames";
import { ScControlBase } from "../internal/sc-control-base";
import { selectContext } from "../internal/contexts";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-option.css";

export class ScOptionBase extends ScControlBase {
  static styles = [foundations, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  #select = new ContextConsumer(this, { context: selectContext, subscribe: true });

  private _onClick = (): void => {
    if (!this.disabled) this.#select.value?.select(this.value);
  };

  render() {
    const ctx = this.#select.value;
    const selected = ctx?.value === this.value;
    const cls = cx("root", ctx?.size ?? this.size, { selected });
    return html`
      <div class=${cls} role="option" aria-selected=${selected} @click=${this._onClick}>
        ${this.label}
      </div>
    `;
  }
}
