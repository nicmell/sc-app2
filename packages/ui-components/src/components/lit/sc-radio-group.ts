// <sc-radio-group-base> — a UI-only radio group coordinating its
// <sc-radio-base> light-DOM children. Unlike the other widgets it renders NO
// template: LitElement's default render() returns `noChange`, so the author's
// radio children are preserved untouched. Its own layout is styled off the
// reflected `orientation` attribute (foundations/components/sc-radio-group.css),
// so there's nothing to render and no host classes to manage. The group only
// syncs each child's checked/size/variant/disabled imperatively. A child's
// `change` is captured here, stops at the group, updates `value`, re-syncs, and
// re-emits at group level.

import { property } from "lit/decorators.js";
import { ScWidgetBase } from "./internal/sc-widget-base";
import type { ScRadioBase } from "./sc-radio";

export class ScRadioGroupBase extends ScWidgetBase {
  @property({ type: Number }) accessor value = 0;
  // Reflected so the host can be styled by attribute (no rendered root to carry
  // a class), which also avoids racing a React-set className on the host.
  @property({ reflect: true }) accessor orientation: "horizontal" | "vertical" = "horizontal";

  private _childObserver?: MutationObserver;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("change", this._onChildChange);
    // Children may be appended after upgrade (e.g. React rendering its
    // children) — re-sync whenever the child list changes.
    this._childObserver = new MutationObserver(() => this._syncChildren());
    this._childObserver.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("change", this._onChildChange);
    this._childObserver?.disconnect();
    this._childObserver = undefined;
  }

  private get _radios(): ScRadioBase[] {
    return Array.from(this.querySelectorAll("sc-radio-base"));
  }

  private _syncChildren(): void {
    for (const radio of this._radios) {
      radio.checked = radio.value === this.value;
      radio.size = this.size;
      radio.variant = this.variant;
      radio.disabled = this.disabled;
    }
  }

  private _onChildChange = (e: Event): void => {
    if (e.target === this) return; // our own re-emit
    // Consume the child event entirely; the group re-emits its own `change` so
    // consumers see one group-level event, never the raw child one.
    e.stopImmediatePropagation();
    if (this.disabled) return;
    const detail = (e as CustomEvent<{ value: number }>).detail;
    const v = detail?.value ?? 0;
    if (v !== this.value) {
      this.value = v;
      this.emit(v);
    } else {
      this._syncChildren();
    }
  };

  protected updated(): void {
    this._syncChildren();
  }
}
