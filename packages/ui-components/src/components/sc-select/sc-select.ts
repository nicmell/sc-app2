// <sc-select-base> — a combobox + custom dropdown, coordinating declarative
// <sc-option-base> children via Lit context. Shadow DOM + <slot>: it renders the
// combobox button and delegates the floating dropdown to <sc-popover-base> (the
// shared top-layer, anchored overlay), projecting the author's options into it.
// The options stay light-DOM; size flows to them via context (they size
// themselves in their own shadow).
//
// The dropdown is the <sc-popover-base>, controlled via its `open`: the combobox
// button toggles it, selecting an option closes it, and native light-dismiss
// reflects back through the popover's `toggle`. The popover anchors to its
// previous element sibling — the combobox button — with no wiring. We can't use
// the native `popovertarget` here: the actual popover element lives inside
// <sc-popover>'s own shadow root, out of the button's reach. So open is
// JS-controlled, with a pointerdown guard that reproduces the invoker exemption
// `popovertarget` gives for free (else clicking the button while open would
// light-dismiss then immediately reopen it).
//
// The host exposes `value` and dispatches a bubbling `change` on selection
// (consumers read `e.target.value`, like a native <select>). Not form-associated.

import { html } from "lit";
import { property, state } from "lit/decorators.js";
import { ContextProvider, createContext } from "@lit/context";
import { ScControlBase, type ScSize } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import type { ScPopoverBase } from "../sc-popover/sc-popover";
import styles from "./sc-select.scss";
import "../sc-icon/sc-icon";
import "../sc-popover/sc-popover";

const LISTBOX_ID = "sc-select-listbox";

// Context this select provides to its declarative <sc-option-base> children (the old
// sc-app coordination model — context-request events bubble from each option up to this
// provider host). Consumed by sc-option via ContextConsumer.
export interface SelectContext {
  /** The select's current value. */
  value: number;
  /** An option calls this on click to request selection. */
  select(value: number): void;
  /** Shared size so each option sizes itself in its own shadow. */
  size: ScSize;
}

export const selectContext = createContext<SelectContext>("sc-select");

export class ScSelectBase extends ScControlBase {
  static styles = [resetStyles, styles];

  @property({ type: Number }) accessor value = 0;
  @property() accessor placeholder = "";
  @state() accessor open = false;

  // Captured on the trigger's pointerdown, BEFORE native light-dismiss queues its
  // toggle, so the click handler knows whether the popover was already open.
  #wasOpen = false;

  #select = (value: number): void => {
    this.open = false;
    if (value !== this.value) {
      this.value = value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  #provider = new ContextProvider(this, { context: selectContext, initialValue: this.#ctx() });

  #ctx(): SelectContext {
    return { value: this.value, select: this.#select, size: this.size };
  }

  get #popover(): ScPopoverBase | null {
    return this.renderRoot.querySelector("sc-popover-base");
  }

  #onTriggerPointerDown = (): void => {
    this.#wasOpen = this.open;
  };
  #onTriggerClick = (): void => {
    // If it was open, light-dismiss already closed it on pointerdown — don't reopen.
    if (!this.#wasOpen) this.open = true;
  };
  #onPopoverToggle = (): void => {
    this.open = this.#popover?.open ?? false;
  };

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
        aria-controls=${LISTBOX_ID}
        ?disabled=${this.disabled}
        @pointerdown=${this.#onTriggerPointerDown}
        @click=${this.#onTriggerClick}
      >
        <span class="label">${this.#label}</span>
        <sc-icon-base class="arrow" name="caret-down"></sc-icon-base>
      </button>
      <sc-popover-base
        id=${LISTBOX_ID}
        role="listbox"
        placement="bottom-start"
        .open=${this.open}
        @toggle=${this.#onPopoverToggle}
      >
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </sc-popover-base>
    `;
  }
}
