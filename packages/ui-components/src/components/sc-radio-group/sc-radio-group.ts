// <sc-radio-group-base> — a Lit ContextProvider coordinating its declarative
// <sc-radio-base> children (the old sc-app model). Shadow DOM: it renders a
// `.root` wrapper + <slot>, so the radio children are slotted (still light-DOM
// children, so their context-request events bubble to the host provider). It
// provides the selected value + a `select` callback + a shared name +
// size/disabled through context. A child's native `change` is swallowed
// and the group re-emits a single `change` from the host (read `el.value`).

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextProvider, createContext } from "@lit/context";
import { ScControlBase, type ScSize } from "../internal/sc-control/sc-control";
import resetStyles from "../../foundations/reset.scss";
import styles from "./sc-radio-group.scss";

// Context this group provides to its declarative <sc-radio-base> children (the old
// sc-app coordination model — context-request events bubble from each child up to this
// provider host, no slot needed). Consumed by sc-radio via ContextConsumer.
export interface RadioGroupContext {
  /** The group's selected value. */
  value: number;
  /** A child calls this on click to request selection. */
  select(value: number): void;
  /** Shared radio `name` so the native inputs form one group. */
  name: string;
  size: ScSize;
  disabled: boolean;
}

export const radioGroupContext = createContext<RadioGroupContext>("sc-radio-group");

let groupId = 0;

export class ScRadioGroupBase extends ScControlBase {
  static styles = [resetStyles, styles];

  @property({ type: Number }) accessor value = 0;
  @property({ reflect: true }) accessor orientation: "horizontal" | "vertical" = "horizontal";
  /** Accessible name for the group (→ aria-label on the role=radiogroup host). */
  @property() accessor label = "";

  // Auto fallback so native grouping works even without a form `name`.
  readonly #autoName = `sc-radio-group-${++groupId}`;

  #select = (value: number): void => {
    if (this.disabled || value === this.value) return;
    this.value = value;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  // Declared after #select so the initializer (which reads it via #ctx())
  // doesn't hit the private-field temporal dead zone.
  #provider = new ContextProvider(this, { context: radioGroupContext, initialValue: this.#ctx() });

  #ctx(): RadioGroupContext {
    return {
      value: this.value,
      select: this.#select,
      name: this.name || this.#autoName,
      size: this.size,
      disabled: this.disabled,
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    // The native radios carry the grouping; mark the container so a screen
    // reader announces it as one radio group.
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
    this.addEventListener("change", this.#onChildChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("change", this.#onChildChange);
  }

  // A child radio's native `change` (should it bubble) is swallowed; the group's
  // own re-emitted `change` (target === this) is the single event consumers see.
  #onChildChange = (e: Event): void => {
    if (e.target !== this) e.stopImmediatePropagation();
  };

  protected updated(): void {
    this.#provider.setValue(this.#ctx());
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
  }

  render() {
    return html`<slot></slot>`;
  }
}
