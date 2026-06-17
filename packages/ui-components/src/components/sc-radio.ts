// <sc-radio-base> — a hidden native <input type="radio"> under a ring/dot
// overlay, and a ContextConsumer of its <sc-radio-group-base>. Selection + the
// shared name + size/variant/disabled come from the group context; clicking
// reports back via ctx.select. The overlay reflects :checked via CSS. Used
// standalone it falls back to its own `checked`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ContextConsumer } from "@lit/context";
import cx from "classnames";
import { ScWidgetBase } from "./internal/sc-widget-base";
import { radioGroupContext, type RadioGroupContext } from "./internal/contexts";
import { resetStyles } from "./internal/reset.styles";
import { widgetBaseStyles } from "./internal/widget-base.styles";
import { radioStyles } from "./sc-radio.styles";

export class ScRadioBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property({ type: Boolean }) accessor checked = false;

  static styles = [resetStyles, widgetBaseStyles, radioStyles];

  #group = new ContextConsumer(this, { context: radioGroupContext, subscribe: true });

  get #ctx(): RadioGroupContext | undefined {
    return this.#group.value;
  }
  get #checked(): boolean {
    return this.#ctx ? this.#ctx.value === this.value : this.checked;
  }
  get #disabled(): boolean {
    return this.#ctx?.disabled ?? this.disabled;
  }

  private _onChange = (): void => {
    if (this.#disabled) return;
    if (this.#ctx) this.#ctx.select(this.value);
    else this.checked = true;
  };

  render() {
    const ctx = this.#ctx;
    const cls = cx(
      "sc-radio",
      `sc-radio--${ctx?.size ?? this.size}`,
      `sc-radio--${ctx?.variant ?? this.variant}`,
      { "sc-radio--disabled": this.#disabled },
    );
    return html`
      <label class=${cls}>
        <input
          class="sc-radio__input sr-only"
          type="radio"
          name=${ctx?.name ?? this.name}
          value=${this.value}
          .checked=${live(this.#checked)}
          ?disabled=${this.#disabled}
          @change=${this._onChange}
        />
        <span class="sc-radio__ring"><span class="sc-radio__dot"></span></span>
        ${this.label ? html`<span class="sc-radio__label">${this.label}</span>` : ""}
      </label>
    `;
  }
}
