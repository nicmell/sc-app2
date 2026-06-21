// <sc-select-base> — a combobox + custom dropdown, coordinating declarative
// <sc-option-base> children via Lit context. Shadow DOM + <slot>: it renders its
// own chrome and projects the author's options into the dropdown. The options
// stay light-DOM; size/variant flow to them via context (they self-apply the
// accent in their own shadow).
//
// The dropdown is a TOP-LAYER popover (PopoverController): it escapes any
// clipping/transformed ancestor and floats above the page, positioned under the
// combobox by @floating-ui/dom. The combobox button carries `popovertarget` so
// the browser owns the open/close toggle and native light-dismiss.
//
// The host exposes `value` and dispatches a bubbling `change` on selection
// (consumers read `e.target.value`, like a native <select>). Not form-associated.

import { LitElement, html } from "lit";
import { property, state } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import cx from "classnames";
import { selectContext, type SelectContext } from "../internal/contexts";
import type { ScSize, ScVariant } from "../internal/sc-widget-base";
import { foundations } from "../internal/foundation-styles";
import { PopoverController } from "../internal/popover-controller";
import { styles } from "./sc-select.styles";

const DROPDOWN_ID = "sc-select-dropdown";

export class ScSelectBase extends LitElement {
  static styles = [foundations, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor placeholder = "";
  @property() accessor name = "";
  @property() accessor size: ScSize = "md";
  @property() accessor variant: ScVariant = "primary";
  @property({ type: Boolean }) accessor disabled = false;
  @state() accessor open = false;

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
    return { value: this.value, select: this.#select, size: this.size, variant: this.variant };
  }

  get #combobox(): HTMLElement | null {
    return this.renderRoot.querySelector(".combobox");
  }
  get #dropdown(): HTMLElement | null {
    return this.renderRoot.querySelector(".dropdown");
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
  }

  render() {
    return html`
      <button
        class=${cx("combobox", this.size)}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open}
        popovertarget=${DROPDOWN_ID}
        ?disabled=${this.disabled}
      >
        <span class="label">${this.#label}</span>
        <span class="arrow" aria-hidden="true"></span>
      </button>
      <div class="dropdown" id=${DROPDOWN_ID} role="listbox">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>
    `;
  }
}
