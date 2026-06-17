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

import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import { selectContext, type SelectContext } from "./internal/contexts";
import type { ScSize, ScVariant } from "./internal/sc-widget-base";

export class ScSelectBase extends LitElement {
  @property({ type: Number }) accessor value = 0;
  @property() accessor placeholder = "";
  @property({ reflect: true }) accessor size: ScSize = "md";
  @property({ reflect: true }) accessor variant: ScVariant = "primary";
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  @state() accessor open = false;

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--font-mono);
      --_accent: var(--color-primary);
    }
    :host([variant="neutral"]) {
      --_accent: var(--color-text-dim);
    }
    :host([variant="ok"]) {
      --_accent: var(--color-ok);
    }
    :host([variant="warn"]) {
      --_accent: var(--color-warn);
    }
    :host([variant="danger"]) {
      --_accent: var(--color-danger);
    }
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    .combobox {
      appearance: none;
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      inline-size: 100%;
      min-inline-size: 6rem;
      margin: 0;
      padding: var(--space-2xs) var(--space-xs);
      background: var(--color-surface-input);
      color: var(--color-text);
      border: 1px solid var(--color-border-stronger);
      border-radius: var(--radius-sm);
      font: inherit;
      font-size: var(--font-size-sm);
      cursor: pointer;
      user-select: none;
      transition: border-color var(--transition-fast);
    }
    :host([size="sm"]) .combobox {
      font-size: var(--font-size-xs);
    }
    :host([size="lg"]) .combobox {
      font-size: var(--font-size-md);
    }
    .combobox:hover,
    .combobox:focus-visible {
      outline: none;
      border-color: var(--color-border-focus);
    }
    .label {
      flex: 1 1 auto;
      text-align: left;
    }
    .arrow {
      inline-size: 0;
      block-size: 0;
      border-left: 0.3rem solid transparent;
      border-right: 0.3rem solid transparent;
      border-top: 0.35rem solid var(--color-text-dim);
    }
    .dropdown {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      right: 0;
      z-index: 10;
      padding: var(--space-3xs);
      background: var(--color-surface-1);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      max-block-size: 14rem;
      overflow-y: auto;
    }
  `;

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
  }

  render() {
    return html`
      <button
        class="combobox"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        ?disabled=${this.disabled}
        @click=${this.#toggle}
        @keydown=${this.#onKeydown}
      >
        <span class="label">${this.#label}</span>
        <span class="arrow" aria-hidden="true"></span>
      </button>
      ${this.open
        ? html`<div class="dropdown" role="listbox">
            <slot @slotchange=${() => this.requestUpdate()}></slot>
          </div>`
        : nothing}
    `;
  }
}
