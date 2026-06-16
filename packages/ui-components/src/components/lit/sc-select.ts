// <sc-select-base> — a UI-only combobox + dropdown. Self-contained via an
// `options` prop ({value,label}[]); owns its open/close state, closes on
// outside-click/Escape, and emits `change` with the chosen value. (The logical
// sc-select wrapper later derives `options` from its sc-option children.)

import { html } from "lit";
import { property, state } from "lit/decorators.js";
import cx from "classnames";
import { ScWidgetBase } from "./internal/sc-widget-base";

export interface ScSelectOption {
  value: number;
  label: string;
}

export class ScSelectBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property({ attribute: false }) accessor options: ScSelectOption[] = [];
  @property() accessor placeholder = "";
  @state() accessor open = false;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this._onDocClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onDocClick);
  }

  private _onDocClick = (e: MouseEvent): void => {
    if (this.open && !this.contains(e.target as Node)) this.open = false;
  };

  private _toggle = (): void => {
    if (!this.disabled) this.open = !this.open;
  };

  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.open = false;
  };

  private _pick(value: number): void {
    this.open = false;
    if (value !== this.value) {
      this.value = value;
      this.emit(value);
    }
  }

  private get _label(): string {
    const found = this.options.find((o) => o.value === this.value);
    return found ? found.label : this.placeholder || String(this.value);
  }

  render() {
    return html`
      <div class=${this.blockClasses("sc-select", { "sc-select--open": this.open })}>
        <button
          type="button"
          class="sc-select__combobox"
          role="combobox"
          aria-expanded=${this.open}
          aria-disabled=${this.disabled}
          ?disabled=${this.disabled}
          @click=${this._toggle}
          @keydown=${this._onKeydown}
        >
          <span class="sc-select__label">${this._label}</span>
          <span class="sc-select__arrow" aria-hidden="true"></span>
        </button>
        ${this.open
          ? html`
              <ul class="sc-select__dropdown" role="listbox">
                ${this.options.map(
                  (o) => html`
                    <li
                      class=${cx("sc-select__option", {
                        "sc-select__option--selected": o.value === this.value,
                      })}
                      role="option"
                      aria-selected=${o.value === this.value}
                      @click=${() => this._pick(o.value)}
                    >
                      ${o.label}
                    </li>
                  `,
                )}
              </ul>
            `
          : ""}
      </div>
    `;
  }
}
