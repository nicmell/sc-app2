// <sc-if> — conditional rendering on the TRUTHINESS of an expression bind
// (the ScVisual base): `bind="osc.gate"`, `bind="vars.freq > 440"`,
// `bind="osc.gate == 0"` — anything the expression engine evaluates; children
// show when the derived value is non-zero.
//
// Light DOM: the children are already-parsed sc-* elements — hiding is the
// `hidden` attribute + stylesheet (display: contents / [hidden] display:
// none), so hidden children stay mounted with their subscriptions alive. The
// parse is transparent (no scope, no path segment): children resolve binds
// against the outer scope. That transparency is also why sc-if must not
// contain node-owning elements (sc-group / sc-synth / sc-synthdef): sc-if
// only hides VISUALLY (a "hidden" synth would still play), and a same-named
// node inside one would collide its controls' store keys with an outer
// sibling's. State elements are covered by their own placement rule (a var
// must be declared on a node).

import { nothing, type PropertyValues } from "lit";
import { isNodeRuntime, isSynthDefRuntime, typeOf } from "@/lib/utils/guards";
import type { DerivedRuntime, RuntimeContext } from "@/types/runtime";
import { failValidation, requireProp } from "@/sc-elements/internal/validation";
import { ScVisual } from "@/sc-elements/internal/sc-visual";
import "./sc-if.scss";

export class ScIf extends ScVisual {
  validate(): void {
    requireProp(this, "bind", this.bind);
    // walkScElements recurses through plain HTML wrappers but stops at sc-*
    // boundaries — a node nested under an inner sc-if is caught by THAT
    // sc-if's own validate() when it processes.
    for (const el of this.walkScElements()) {
      if (isNodeRuntime(el) || isSynthDefRuntime(el)) {
        failValidation(this, `must not contain node elements (found <${typeOf(el)}>)`);
      }
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): DerivedRuntime {
    this.processChildren(ctx);
    return super.resolveRuntime(ctx);
  }

  /** Host attributes are side effects — keep them out of render(). */
  protected willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.toggleAttribute("hidden", !this._value);
  }

  render() {
    return nothing;
  }
}
