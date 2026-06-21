// <sc-popover-base> — a generic anchored overlay panel rendered in the top
// layer (escapes overflow/transform/z-index), positioned against an anchor with
// @floating-ui/dom via the shared PopoverController. Shadow DOM; adopts the
// shared foundation sheet. Controlled by `open`; anchors to `anchor` (an element
// set via property) or, by default, the host's previous element sibling — so a
// trigger button placed right before it works with no wiring. Native
// light-dismiss (outside-click + Esc) reflects back through `open` + a `toggle`
// event. The basis for menus/comboboxes/tooltips; sc-select uses the controller
// directly (same-shadow popovertarget) rather than nesting this.

import { LitElement, html, unsafeCSS } from "lit";
import { property } from "lit/decorators.js";
import type { Placement } from "@floating-ui/dom";
import { foundationStyles } from "./internal/foundation-styles";
import { PopoverController } from "./internal/popover-controller";
import styles from "./sc-popover.module.css";
import sheet from "./sc-popover.module.css?inline";

export class ScPopoverBase extends LitElement {
  @property({ type: Boolean }) accessor open = false;
  @property() accessor placement: Placement = "bottom-start";
  /** Anchor element (set via JS/React); defaults to the previous element sibling. */
  accessor anchor: HTMLElement | null = null;

  // Tokens/reset/base reach the shadow via foundationStyles + :root inheritance;
  // this component's own (scoped) CSS comes from its module's `?inline` text.
  static styles = [...(foundationStyles ? [foundationStyles] : []), unsafeCSS(sheet ?? "")];

  #popover = new PopoverController(this, {
    placement: this.placement,
    onToggle: (open) => this.#reflect(open),
  });

  get #panel(): HTMLElement {
    return this.renderRoot.querySelector("." + styles.panel)!;
  }
  get #anchorEl(): HTMLElement | null {
    return this.anchor ?? (this.previousElementSibling as HTMLElement | null);
  }

  #reflect(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    this.dispatchEvent(new Event("toggle", { bubbles: true }));
  }

  protected firstUpdated(): void {
    const anchor = this.#anchorEl;
    if (anchor) this.#popover.attach(this.#panel, anchor);
    if (this.open) this.#popover.show();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("placement")) this.#popover.setPlacement(this.placement);
    if (changed.has("open") && this.open !== this.#popover.open) {
      if (this.open) this.#popover.show();
      else this.#popover.hide();
    }
  }

  render() {
    return html`<div class=${styles.panel}><slot></slot></div>`;
  }
}
