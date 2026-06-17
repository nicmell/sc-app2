// <sc-select-base> — a combobox + custom dropdown, coordinating declarative
// <sc-option-base> children via Lit context. This is the ONE shadow-DOM
// component in the package: it must render its own chrome AND project the
// author's option children into the dropdown, which light-DOM render would
// clobber — so it uses shadow DOM + <slot>. Chrome styling lives in
// `static styles` (tokens pierce the shadow boundary); the slotted options
// stay light-DOM and are styled by the global `.sc-option` CSS.
//
// The host exposes `value` and dispatches a bubbling `change` on selection
// (consumers read `e.target.value`, like a native <select>).
//
// Styling: the foundation stylesheet is adopted into the shadow root as a shared
// constructable sheet, so the chrome lives in foundations/components/sc-select.css
// (`:host` + `.sc-select__*`) like every other component — no inline css here.

import { LitElement, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import { selectContext, type SelectContext } from "./internal/contexts";
import type { ScSize, ScVariant } from "./internal/sc-widget-base";
import { foundationStyles } from "./internal/foundation-styles";

export class ScSelectBase extends LitElement {
  // Form-associated: it has no native control (shadow DOM), so it submits its
  // value through ElementInternals. The form reads the `name` content attribute.
  static formAssociated = true;

  @property({ type: Number }) accessor value = 0;
  @property() accessor placeholder = "";
  @property({ reflect: true }) accessor name = "";
  @property({ reflect: true }) accessor size: ScSize = "md";
  @property({ reflect: true }) accessor variant: ScVariant = "primary";
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  @state() accessor open = false;

  // Guarded — some non-browser test envs lack attachInternals.
  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  // Adopt the shared foundation sheet into the shadow root; chrome rules live in
  // foundations/components/sc-select.css.
  static styles = foundationStyles ? [foundationStyles] : [];

  #select = (value: number): void => {
    this.open = false;
    if (value !== this.value) {
      this.value = value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  #provider = new ContextProvider(this, { context: selectContext, initialValue: this.#ctx() });

  #ctx(): SelectContext {
    return { value: this.value, select: this.#select };
  }

  #toggle = (): void => {
    if (!this.disabled) this.open = !this.open;
  };

  #onKeydown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.open = false;
  };

  // Outside-click closes — composedPath() so a click inside still counts.
  #onDocClick = (e: MouseEvent): void => {
    if (this.open && !e.composedPath().includes(this)) this.open = false;
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.#onDocClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.#onDocClick);
  }

  get #label(): string {
    const options = Array.from(this.querySelectorAll("sc-option-base")) as Array<
      HTMLElement & { value: number; label: string }
    >;
    const selected = options.find((o) => o.value === this.value);
    return selected ? selected.label : this.placeholder || String(this.value);
  }

  protected updated(): void {
    this.#provider.setValue(this.#ctx());
    this.#internals?.setFormValue(String(this.value));
  }

  render() {
    return html`
      <button
        class="sc-select__combobox"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        ?disabled=${this.disabled}
        @click=${this.#toggle}
        @keydown=${this.#onKeydown}
      >
        <span class="sc-select__label">${this.#label}</span>
        <span class="sc-select__arrow" aria-hidden="true"></span>
      </button>
      ${this.open
        ? html`<div class="sc-select__dropdown" role="listbox">
            <slot @slotchange=${() => this.requestUpdate()}></slot>
          </div>`
        : nothing}
    `;
  }
}
