// <sc-radio-group-base> — a Lit ContextProvider coordinating its slotted
// <sc-radio-base> children. Shadow DOM (renders a <slot>); provides the selected
// value + a `select` callback + shared name + size/variant/disabled through
// context (which crosses the shadow boundary). A child reports selection via the
// context callback, and the group re-emits a single `change` from the host
// (consumers read `el.value`, like a native <select>). Form-associated
// (ElementInternals) so the selected value submits under the group's `name`.

import { html } from "lit";
import { property } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import { ScWidgetBase } from "./internal/sc-widget-base";
import { radioGroupContext, type RadioGroupContext } from "./internal/contexts";
import { resetStyles } from "./internal/reset.styles";
import { radioGroupStyles } from "./sc-radio-group.styles";

let groupId = 0;

export class ScRadioGroupBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  @property({ reflect: true }) accessor orientation: "horizontal" | "vertical" = "horizontal";
  /** Accessible name for the group (→ aria-label on the role=radiogroup host). */
  @property() accessor label = "";

  static styles = [resetStyles, radioGroupStyles];

  // Shared name fallback (passed to the radios' inner inputs via context).
  readonly #autoName = `sc-radio-group-${++groupId}`;

  static formAssociated = true;

  readonly #internals: ElementInternals | undefined = (() => {
    try {
      return this.attachInternals();
    } catch {
      return undefined;
    }
  })();

  #select = (value: number): void => {
    if (this.disabled || value === this.value) return;
    this.value = value;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Declared after #name/#select so the initializer (which reads them via
  // #ctx()) doesn't hit the private-field temporal dead zone.
  #provider = new ContextProvider(this, { context: radioGroupContext, initialValue: this.#ctx() });

  #ctx(): RadioGroupContext {
    return {
      value: this.value,
      select: this.#select,
      name: this.name || this.#autoName,
      size: this.size,
      variant: this.variant,
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

  // A child radio's native `change` bubbles here — swallow it; the group's own
  // re-emitted `change` (target === this) is the single event consumers see.
  #onChildChange = (e: Event): void => {
    if (e.target !== this) e.stopImmediatePropagation();
  };

  protected updated(): void {
    this.#provider.setValue(this.#ctx());
    this.#internals?.setFormValue(String(this.value));
    if (this.label) this.setAttribute("aria-label", this.label);
    else this.removeAttribute("aria-label");
  }

  render() {
    return html`<slot></slot>`;
  }
}
