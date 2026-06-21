// <sc-option-base> — a declarative option row and a ContextConsumer of its
// <sc-select-base>. Selection comes from context (selected = ctx.value ===
// value); clicking reports back via ctx.select. Light DOM (slotted into the
// select's dropdown), styled by its own scoped CSS module.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextConsumer } from "@lit/context";
import cx from "classnames";
import { ScWidgetBase, widgetShared as w } from "./internal/sc-widget-base";
import { selectContext } from "./internal/contexts";
import styles from "./sc-option.module.css";

export class ScOptionBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  #select = new ContextConsumer(this, { context: selectContext, subscribe: true });

  private _onClick = (): void => {
    if (!this.disabled) this.#select.value?.select(this.value);
  };

  render() {
    const selected = this.#select.value?.value === this.value;
    return html`
      <div
        class=${cx(styles.root, styles[this.size], {
          [styles.selected]: selected,
          [w.disabled]: this.disabled,
        })}
        role="option"
        aria-selected=${selected}
        @click=${this._onClick}
      >
        ${this.label}
      </div>
    `;
  }
}
