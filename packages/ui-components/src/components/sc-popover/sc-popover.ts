// <sc-popover-base> — a generic anchored overlay panel rendered in the top layer
// (escapes overflow/transform/z-index), positioned against an anchor with
// @floating-ui/dom. Shadow DOM; adopts the shared foundation sheet. Controlled by
// `open`; anchors to `anchor` (an element set via property) or, by default, the
// host's previous element sibling — so a trigger button placed right before it
// works with no wiring. Native light-dismiss (outside-click + Esc) reflects back
// through `open` + a `toggle` event. The composable basis for menus/comboboxes/
// tooltips — sc-select nests one as its dropdown.
//
// The Popover API + floating-ui positioning live here directly (sc-popover is the
// only consumer, so no separate controller). `open` is the single source of truth:
// the native `toggle` reflects user-driven changes (light-dismiss) back into it and
// re-emits a bubbling `toggle` for React; setting `open` drives showPopover()/
// hidePopover(). Requires the Popover API (Baseline since 2024 — Chrome/Edge 114,
// Safari 17, Firefox 125); no fallback, since a positioned-but-not-top-layer panel
// without light-dismiss would only look like it works.

import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { computePosition, autoUpdate, offset, flip, shift, type Placement } from "@floating-ui/dom";
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-popover.scss";

export class ScPopoverBase extends LitElement {
  @property({ type: Boolean }) accessor open = false;
  @property() accessor placement: Placement = "bottom-start";
  /** Anchor element (set via JS/React); defaults to the previous element sibling. */
  accessor anchor: HTMLElement | null = null;

  static styles = [foundations, styles];

  #stopAutoUpdate?: () => void;

  get #panel(): HTMLElement | null {
    return this.renderRoot.querySelector(".panel");
  }
  get #anchorEl(): HTMLElement | null {
    return this.anchor ?? (this.previousElementSibling as HTMLElement | null);
  }

  protected firstUpdated(): void {
    // The panel must carry `popover` unconditionally (popover elements are
    // display:none until shown); its native `toggle` is our source of truth for open.
    const panel = this.#panel;
    if (panel && panel.getAttribute("popover") == null) panel.setAttribute("popover", "auto");
    panel?.addEventListener("toggle", this.#onNativeToggle);
    if (this.open) this.#show();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("placement") && this.open) this.#position();
    if (changed.has("open")) {
      if (this.open) this.#show();
      else this.#hide();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stop();
    this.#panel?.removeEventListener("toggle", this.#onNativeToggle);
  }

  // The native `toggle` (incl. light-dismiss) is the source of truth for user-driven
  // changes; it's also where we (re)position on open, so floating-ui runs only once
  // the element is actually shown in the top layer. Programmatic open/close arrives
  // here already in sync (`this.open` set first, then showPopover() fires the native
  // toggle) — so we position but don't re-emit.
  #onNativeToggle = (e: Event): void => {
    const open = (e as ToggleEvent).newState === "open";
    if (open) this.#position();
    if (this.open === open) return;
    this.open = open;
    this.dispatchEvent(new Event("toggle", { bubbles: true }));
  };

  #show(): void {
    // Positioning happens in #onNativeToggle once the popover is in the top layer.
    try {
      this.#panel?.showPopover();
    } catch {
      /* not connected / already open */
    }
  }

  #hide(): void {
    try {
      this.#panel?.hidePopover();
    } catch {
      /* already closed */
    }
    this.#stop();
  }

  #position(): void {
    const panel = this.#panel;
    const anchor = this.#anchorEl;
    if (!panel || !anchor) return;
    this.#stop();
    panel.style.position = "fixed";
    panel.style.margin = "0";
    this.#stopAutoUpdate = autoUpdate(anchor, panel, () => {
      void computePosition(anchor, panel, {
        strategy: "fixed",
        placement: this.placement,
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
      });
    });
  }

  #stop(): void {
    this.#stopAutoUpdate?.();
    this.#stopAutoUpdate = undefined;
  }

  render() {
    // `part="panel"` exposes the overlay surface so a host (e.g. sc-select) can
    // tune its chrome — padding/size — from the outside via ::part(panel).
    return html`<div class="panel" part="panel"><slot></slot></div>`;
  }
}
