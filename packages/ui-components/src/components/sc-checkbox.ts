// <sc-checkbox-base> — a hidden native <input type="checkbox"> under a visual
// overlay (box + check). Shadow DOM; owns its styles via Lit `css`
// (sc-checkbox.styles.ts + the shared widget base). The input owns value + fires
// the native `change` (read `e.target.checked`); the overlay reflects state via
// CSS; the component is form-associated (ElementInternals) so it still submits
// in a <form> under its `name`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ScWidgetBase } from "./internal/sc-widget-base";
import { resetStyles } from "./internal/reset.styles";
import { widgetBaseStyles } from "./internal/widget-base.styles";
import { checkboxStyles } from "./sc-checkbox.styles";

export class ScCheckboxBase extends ScWidgetBase {
  @property({ type: Boolean }) accessor checked = false;
  @property() accessor label = "";

  static styles = [resetStyles, widgetBaseStyles, checkboxStyles];

  static formAssociated = true;

  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  // Sync the property + re-emit a composed `change` so host listeners see it.
  private _onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement).checked;
    this.reemit(e);
  };

  protected updated(): void {
    this.#internals?.setFormValue(this.checked ? "on" : null);
  }

  render() {
    return html`
      <label class=${this.blockClasses("sc-checkbox")}>
        <input
          class="sc-checkbox__input sr-only"
          type="checkbox"
          name=${this.name}
          .checked=${live(this.checked)}
          ?disabled=${this.disabled}
          @change=${this._onChange}
        />
        <span class="sc-checkbox__box"><span class="sc-checkbox__check"></span></span>
        ${this.label ? html`<span class="sc-checkbox__label">${this.label}</span>` : ""}
      </label>
    `;
  }
}
