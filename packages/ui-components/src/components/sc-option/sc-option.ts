// <sc-option-base> — a declarative option row and a ContextConsumer of its
// <sc-select-base>. Shadow DOM: selection comes from context (selected =
// ctx.value === value); clicking reports back via ctx.select. Size/variant also
// flow through the context, applied as classes in the option's own shadow so the
// accent resolves locally (no cross-boundary `--_accent` handoff).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextConsumer } from "@lit/context";
import cx from "classnames";
import { ScWidgetBase } from "../internal/sc-widget-base";
import { selectContext } from "../internal/contexts";
import { foundations } from "../internal/foundation-styles";
import { widgetStyles } from "../internal/widget-base.styles";
import { styles } from "./sc-option.styles";

export class ScOptionBase extends ScWidgetBase {
  static styles = [foundations, widgetStyles, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";

  #select = new ContextConsumer(this, { context: selectContext, subscribe: true });

  private _onClick = (): void => {
    if (!this.disabled) this.#select.value?.select(this.value);
  };

  render() {
    const ctx = this.#select.value;
    const selected = ctx?.value === this.value;
    const cls = cx("root", ctx?.size ?? this.size, ctx?.variant ?? this.variant, {
      selected,
      disabled: this.disabled,
    });
    return html`
      <div class=${cls} role="option" aria-selected=${selected} @click=${this._onClick}>
        ${this.label}
      </div>
    `;
  }
}
