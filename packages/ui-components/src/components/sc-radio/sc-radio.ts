// <sc-radio-base> — a hidden native <input type="radio"> under a ring/dot
// overlay, and a ContextConsumer of its <sc-radio-group-base>. Shadow DOM:
// selection + the shared name + size/disabled come from the group
// context; clicking reports back via ctx.select. Standalone, it falls back to
// its own `checked` and re-emits a composed `change` from the host.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ContextConsumer } from "@lit/context";
import cx from "classnames";
import { ScControlBase } from "../internal/sc-control-base";
import { radioGroupContext, type RadioGroupContext } from "../internal/contexts";
import { foundations, controlStyles } from "../internal/foundation-styles";
import styles from "./sc-radio.scss";

export class ScRadioBase extends ScControlBase {
  static styles = [foundations, controlStyles, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor label = "";
  @property({ type: Boolean }) accessor checked = false;

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

  private _onChange = (e: Event): void => {
    e.stopPropagation();
    if (this.#disabled) return;
    if (this.#ctx) {
      this.#ctx.select(this.value);
    } else {
      this.checked = true;
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
  };

  render() {
    const ctx = this.#ctx;
    // Own-disabled styles via :host([disabled]); a disabled GROUP dims all its radios via
    // the group's own :host([disabled]). #disabled (own OR group) still drives the input.
    const cls = cx("root", ctx?.size ?? this.size);
    return html`
      <label class=${cls}>
        <input
          class="input sr-only"
          type="radio"
          name=${ctx?.name ?? this.name}
          value=${this.value}
          .checked=${live(this.#checked)}
          ?disabled=${this.#disabled}
          @change=${this._onChange}
        />
        <span class="ring"><span class="dot"></span></span>
        ${this.label ? html`<span>${this.label}</span>` : ""}
      </label>
    `;
  }
}
