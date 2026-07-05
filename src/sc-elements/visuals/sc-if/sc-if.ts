// <sc-if> — conditional rendering keyed on a bound control/var
// (`bind`/`_targetScNode` on the ScInput base). Ports the old element's
// grammar: exactly one comparator applies, in priority order — is-equal
// (string equality) → is-not-equal → is-greater-than (numeric) →
// is-lesser-than — falling back to plain truthiness. Visibility (the old
// app's semantics, via `_shouldShow`):
//   - both is-truthy AND is-falsy set → always visible, the TEXT swaps;
//   - only is-truthy → visible when the test passes;
//   - only is-falsy  → visible when it fails;
//   - neither        → visible when it passes.
// An EMPTY is-truthy/is-falsy shows the children; non-empty text replaces
// them (the swap span is Lit-managed; the author children are CSS-hidden via
// the data-sc-if-text marker — see sc-if.scss; loose text-NODE children stay
// visible in that mode, which no fixture uses).
//
// Light DOM: the children are already-parsed sc-* elements — hiding is a
// `hidden` attribute + stylesheet (display: contents / [hidden] display:
// none), so hidden children stay mounted with their subscriptions alive,
// exactly like the old shadow/slot version. The parse is transparent (no
// scope, no path segment): children resolve binds against the outer scope.

import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { isStateRuntime } from "@/lib/utils/guards";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";
import "./sc-if.scss";

export class ScIf extends ScInput {
  @property({ attribute: "is-truthy" }) accessor isTruthy: string | null = null;
  @property({ attribute: "is-falsy" }) accessor isFalsy: string | null = null;
  @property({ attribute: "is-equal" }) accessor isEqual: string | null = null;
  @property({ attribute: "is-not-equal" }) accessor isNotEqual: string | null = null;
  @property({ attribute: "is-greater-than" }) accessor isGreaterThan: string | null = null;
  @property({ attribute: "is-lesser-than" }) accessor isLesserThan: string | null = null;

  @state() accessor _value: number | undefined = undefined;

  private offValue?: () => void;

  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    this.processChildren(ctx);
    return super.resolveRuntime(ctx);
  }

  async load(): Promise<void> {
    this.offValue?.(); // re-entrant: drop the stale subscription on reload
    this.offValue = undefined;
    const target = this._targetScNode;
    if (target && isStateRuntime(target) && target.enabled) {
      const view = target.selectValue();
      this._value = view.get();
      this.offValue = view.subscribe((v) => {
        if (v !== undefined) this._value = v;
      });
    }
    await super.load();
  }

  unload(): void {
    super.unload();
    this.offValue?.();
    this.offValue = undefined;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.offValue?.();
    this.offValue = undefined;
  }

  /** The condition, old priority order; truthiness as the fallback. */
  private test(): boolean {
    const value = this._value;
    if (this.isEqual !== null) return String(value) === this.isEqual;
    if (this.isNotEqual !== null) return String(value) !== this.isNotEqual;
    if (this.isGreaterThan !== null) return (value ?? NaN) > parseFloat(this.isGreaterThan);
    if (this.isLesserThan !== null) return (value ?? NaN) < parseFloat(this.isLesserThan);
    return !!value;
  }

  /** When both is-truthy and is-falsy are set the container always shows —
   *  the text content swaps on the condition instead. */
  private shouldShow(pass: boolean, hasTruthy: boolean, hasFalsy: boolean): boolean {
    if (hasTruthy && hasFalsy) return true;
    if (hasTruthy) return pass;
    if (hasFalsy) return !pass;
    return pass;
  }

  /** The swap text for the current state — null shows the children. */
  private swapText(pass: boolean, hasTruthy: boolean, hasFalsy: boolean): string | null {
    if (hasTruthy && hasFalsy) return (pass ? this.isTruthy : this.isFalsy) || null;
    if (hasTruthy) return this.isTruthy || null;
    if (hasFalsy) return this.isFalsy || null;
    return null;
  }

  /** Host attributes are side effects — keep them out of render(). */
  protected willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const pass = this.test();
    const hasTruthy = this.isTruthy !== null;
    const hasFalsy = this.isFalsy !== null;
    this.toggleAttribute("hidden", !this.shouldShow(pass, hasTruthy, hasFalsy));
    this.toggleAttribute("data-sc-if-text", this.swapText(pass, hasTruthy, hasFalsy) !== null);
  }

  render() {
    const text = this.swapText(this.test(), this.isTruthy !== null, this.isFalsy !== null);
    return text === null ? nothing : html`<span data-sc-if-text>${text}</span>`;
  }
}
