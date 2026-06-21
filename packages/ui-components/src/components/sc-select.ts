// <sc-select-base> — a combobox + custom dropdown, coordinating declarative
// <sc-option-base> children via Lit context. This is the ONE shadow-DOM
// component in the package: it must render its own chrome AND project the
// author's option children into the dropdown, which light-DOM render would
// clobber — so it uses shadow DOM + <slot>. Chrome styling lives in
// `static styles` (tokens pierce the shadow boundary); the slotted options
// stay light-DOM and are styled by the global `.sc-option` CSS.
//
// The dropdown is a TOP-LAYER popover (PopoverController): it escapes any
// clipping/transformed ancestor (e.g. a dashboard grid cell) and floats above
// the page, positioned under the combobox by @floating-ui/dom. The combobox
// button carries `popovertarget` so the browser owns the open/close toggle and
// native light-dismiss (outside-click + Esc) — no manual document listeners.
//
// The host exposes `value` and dispatches a bubbling `change` on selection
// (consumers read `e.target.value`, like a native <select>).
//
// Styling: tokens/reset/base reach the shadow via foundationStyles + :root
// inheritance; this component's own (scoped) chrome comes from its CSS module's
// `?inline` text, adopted alongside.

import { LitElement, html, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import { selectContext, type SelectContext } from "./internal/contexts";
import type { ScSize, ScVariant } from "./internal/sc-widget-base";
import { foundationStyles } from "./internal/foundation-styles";
import { PopoverController } from "./internal/popover-controller";
import styles from "./sc-select.module.css";
import sheet from "./sc-select.module.css?inline";

const DROPDOWN_ID = "sc-select-dropdown";

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

  static styles = [...(foundationStyles ? [foundationStyles] : []), unsafeCSS(sheet ?? "")];

  // The dropdown floats in the top layer, anchored to the combobox button.
  #popover = new PopoverController(this, { onToggle: (open) => (this.open = open) });

  #select = (value: number): void => {
    this.#popover.hide();
    if (value !== this.value) {
      this.value = value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  #provider = new ContextProvider(this, { context: selectContext, initialValue: this.#ctx() });

  #ctx(): SelectContext {
    return { value: this.value, select: this.#select };
  }

  get #combobox(): HTMLElement | null {
    return this.renderRoot.querySelector("." + styles.combobox);
  }
  get #dropdown(): HTMLElement | null {
    return this.renderRoot.querySelector("." + styles.dropdown);
  }

  get #label(): string {
    const options = Array.from(this.querySelectorAll("sc-option-base")) as Array<
      HTMLElement & { value: number; label: string }
    >;
    const selected = options.find((o) => o.value === this.value);
    return selected ? selected.label : this.placeholder || String(this.value);
  }

  protected firstUpdated(): void {
    const panel = this.#dropdown;
    const anchor = this.#combobox;
    if (panel && anchor) this.#popover.attach(panel, anchor);
  }

  protected updated(): void {
    this.#provider.setValue(this.#ctx());
    this.#internals?.setFormValue(String(this.value));
  }

  render() {
    return html`
      <button
        class=${styles.combobox}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        popovertarget=${DROPDOWN_ID}
        ?disabled=${this.disabled}
      >
        <span class=${styles.label}>${this.#label}</span>
        <span class=${styles.arrow} aria-hidden="true"></span>
      </button>
      <div class=${styles.dropdown} id=${DROPDOWN_ID} role="listbox">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>
    `;
  }
}
