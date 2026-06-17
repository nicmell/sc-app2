// <sc-switch-base> — a hidden native <input type="checkbox" role="switch"> under
// a track+thumb overlay. Shadow DOM; owns its styles via Lit `css`
// (sc-switch.styles.ts + the shared widget base). The input owns value + fires
// the native `change`; form-associated (ElementInternals) so it submits in a
// <form> under its `name`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";
import { resetStyles } from "./internal/reset.styles";
import { widgetBaseStyles } from "./internal/widget-base.styles";
import { switchStyles } from "./sc-switch.styles";

export class ScSwitchBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;

  static styles = [resetStyles, widgetBaseStyles, switchStyles];

  static formAssociated = true;

  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  private _onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
    this.reemit(e);
  };

  protected updated(): void {
    this.#internals?.setFormValue(this.checked ? "on" : null);
  }

  render() {
    return html`
      <label class=${this.blockClasses("sc-switch")}>
        <input
          class="sc-switch__input sr-only"
          type="checkbox"
          role="switch"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="sc-switch__track"><span class="sc-switch__thumb"></span></span>
      </label>
    `;
  }
}
