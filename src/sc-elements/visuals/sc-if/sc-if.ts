// <sc-if> — conditional rendering on the TRUTHINESS of an expression bind
// (the ScDerived base): `bind="osc.gate"`, `bind="vars.freq > 440"`,
// `bind="osc.gate == 0"` — anything the expression engine evaluates; children
// show when the live `_state` is non-zero.
//
// Light DOM: hiding is the `hidden` attribute + stylesheet (display: contents
// / [hidden] display: none). sc-if is a TRANSPARENT container (nameless — see
// internal/validation isTransparent): it opens no sibling scope and no store
// path segment; its contents are hydrated, duplicate-checked, and processed
// by the ENCLOSING level (the parse walks through it), attach to the sc-if as
// their true parse parent, and belong to the enclosing node as their
// effective owner (`namedScParent`). The contents are therefore
// UNCONDITIONALLY LIVE — a synth inside a hidden sc-if keeps playing, a var
// keys at the enclosing path — only visibility is conditional.

import { nothing, type PropertyValues } from "lit";
import type { DerivedRuntime, RuntimeContext } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScDerived } from "@/sc-elements/internal/sc-derived";
import "./sc-if.scss";

export class ScIf extends ScDerived {
  validate(): void {
    requireProp(this, "bind", this.bind ?? "");
  }

  protected resolveRuntime(ctx: RuntimeContext): DerivedRuntime {
    return this.derivedRuntime(ctx);
  }

  /** Host attributes are side effects — keep them out of render(). */
  protected willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.toggleAttribute("hidden", !this._state);
  }

  render() {
    return nothing;
  }
}
