// PopoverController — turns a panel element into a top-layer, anchored,
// light-dismissable popover. Reusable by any Lit element (sc-popover-base,
// sc-select). The panel must be rendered UNCONDITIONALLY with the `popover`
// attribute (popover elements are display:none until shown); the controller
// shows/hides it in the browser top layer (escapes overflow/transform/z-index)
// and positions it against an anchor with @floating-ui/dom.
//
// Native light-dismiss (outside-click + Esc) comes free from `popover="auto"`;
// the `toggle` event is the single source of truth for open state. Guarded so
// importing/using it never throws where the Popover API is absent (it then
// falls back to plain open-state toggling + the element's own CSS positioning).

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { computePosition, autoUpdate, offset, flip, shift, type Placement } from "@floating-ui/dom";

const POPOVER_SUPPORTED =
  typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

export interface PopoverOptions {
  placement?: Placement;
  onToggle?: (open: boolean) => void;
}

export class PopoverController implements ReactiveController {
  open = false;

  #host: ReactiveControllerHost;
  #panel?: HTMLElement;
  #anchor?: HTMLElement;
  #placement: Placement;
  #onToggle?: (open: boolean) => void;
  #stopAutoUpdate?: () => void;

  constructor(host: ReactiveControllerHost, opts: PopoverOptions = {}) {
    this.#host = host;
    this.#placement = opts.placement ?? "bottom-start";
    this.#onToggle = opts.onToggle;
    host.addController(this);
  }

  /** Wire the floating panel + its anchor (call after render, e.g. in updated). */
  attach(panel: HTMLElement, anchor: HTMLElement): void {
    if (this.#panel === panel && this.#anchor === anchor) return;
    this.#teardown();
    this.#panel = panel;
    this.#anchor = anchor;
    if (POPOVER_SUPPORTED) {
      if (panel.getAttribute("popover") == null) panel.setAttribute("popover", "auto");
      panel.addEventListener("toggle", this.#onNativeToggle);
    }
  }

  setPlacement(placement: Placement): void {
    this.#placement = placement;
    if (this.open) this.#position();
  }

  show(): void {
    if (!this.#panel) return;
    if (POPOVER_SUPPORTED) {
      try {
        this.#panel.showPopover();
      } catch {
        /* already open */
      }
    } else {
      this.#setOpen(true); // no toggle event in the fallback
    }
  }

  hide(): void {
    if (!this.#panel) return;
    if (POPOVER_SUPPORTED) {
      try {
        this.#panel.hidePopover();
      } catch {
        /* already closed */
      }
    } else {
      this.#setOpen(false);
    }
  }

  toggle(): void {
    if (this.open) this.hide();
    else this.show();
  }

  // The `toggle` event (incl. native light-dismiss) is the source of truth.
  #onNativeToggle = (e: Event): void => {
    this.#setOpen((e as ToggleEvent).newState === "open");
  };

  #setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    if (open) this.#position();
    else this.#stop();
    this.#onToggle?.(open);
    this.#host.requestUpdate();
  }

  #position(): void {
    const panel = this.#panel;
    const anchor = this.#anchor;
    if (!panel || !anchor) return;
    this.#stop();
    panel.style.position = "fixed";
    panel.style.margin = "0";
    this.#stopAutoUpdate = autoUpdate(anchor, panel, () => {
      void computePosition(anchor, panel, {
        strategy: "fixed",
        placement: this.#placement,
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

  #teardown(): void {
    this.#stop();
    this.#panel?.removeEventListener("toggle", this.#onNativeToggle);
  }

  hostDisconnected(): void {
    this.#teardown();
  }
}
