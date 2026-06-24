// <sc-disclosure-base> — a collapsible section. Wraps the NATIVE <details> (so
// open/close behaviour + accessibility are free) in a shadow root, adding
// design-system chrome (card border, padding, a rotating chevron — see
// sc-disclosure.styles.ts) and a controllable `open` prop.
//
// Shadow DOM so it can render the <details>/<summary> structure while projecting
// the author's content: a `summary` named slot fills the clickable summary, the
// default slot the revealed body. `open` is synced both ways — set it to control
// the element; the native `toggle` (user click) mirrors back into `open` and
// re-emits a bubbling `toggle` for React (onToggle).

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-disclosure.styles";
import "../sc-icon/sc-icon";

export class ScDisclosureBase extends LitElement {
  @property({ type: Boolean, reflect: true }) accessor open = false;

  static styles = [foundations, styles];

  get #details(): HTMLDetailsElement | null {
    return this.renderRoot.querySelector("details");
  }

  // The native <details> owns the toggle; mirror its state back into `open` and
  // re-emit for React. Setting `open` (below) fires this too, harmlessly.
  #onToggle = (): void => {
    const details = this.#details;
    if (!details) return;
    if (this.open !== details.open) this.open = details.open;
    this.dispatchEvent(new Event("toggle", { bubbles: true }));
  };

  protected firstUpdated(): void {
    this.#sync();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("open")) this.#sync();
  }

  // Push `open` onto the native element (which the user can also toggle directly).
  #sync(): void {
    const details = this.#details;
    if (details && details.open !== this.open) details.open = this.open;
  }

  render() {
    return html`
      <details class="root" @toggle=${this.#onToggle}>
        <summary class="summary">
          <slot name="summary"></slot>
          <sc-icon-base class="chevron" name="caret-right"></sc-icon-base>
        </summary>
        <div class="content"><slot></slot></div>
      </details>
    `;
  }
}
