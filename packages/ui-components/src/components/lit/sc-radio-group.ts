// <sc-radio-group-base> — a UI-only radio group coordinating its
// <sc-radio-base> light-DOM children. Unlike the other widgets it renders NO
// template: LitElement's default render() returns `noChange`, so the author's
// radio children are preserved untouched. The group instead (a) sets its own
// layout modifier classes on the host and (b) syncs each child's checked/size/
// variant/disabled imperatively. A child's `change` is captured here, stops at
// the group, updates `value`, re-syncs, and re-emits at group level.

import { property } from "lit/decorators.js";
import { ScInputBase } from "./internal/sc-input-base";
import type { ScRadioBase } from "./sc-radio";

export class ScRadioGroupBase extends ScInputBase {
  @property({ type: Number }) accessor value = 0;
  @property() accessor orientation: "horizontal" | "vertical" = "horizontal";

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
    return Array.from(this.querySelectorAll<ScRadioBase>("sc-radio-base"));
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
    e.stopPropagation();
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
    this.classList.add("sc-radio-group");
    this.classList.toggle("sc-radio-group--vertical", this.orientation === "vertical");
    this.classList.toggle("sc-radio-group--horizontal", this.orientation === "horizontal");
    this.classList.toggle("sc-radio-group--disabled", this.disabled);
    this._syncChildren();
  }
}
