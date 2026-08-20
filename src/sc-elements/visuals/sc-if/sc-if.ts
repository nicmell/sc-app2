// <sc-if> — conditional rendering on the TRUTHINESS of a `bind:when`
// expression (the ScElement runtime-prop machinery): `bind:when="osc.gate"`,
// `bind:when="vars.freq > 440"`, `bind:when="osc.gate == 0"` — anything the
// expression engine evaluates; children show when the live value is truthy
// (non-zero, non-empty-string).
//
// Light DOM: hiding is the `hidden` attribute + stylesheet (display: contents
// / [hidden] display: none). sc-if is a TRANSPARENT container (nameless — see
// internal/engine/resolution isTransparent): it opens no sibling scope and no store
// path segment; its contents are collected, duplicate-checked, and processed
// by the ENCLOSING level (the parse walks through it) and attach DIRECTLY to
// the enclosing node (`processParent` walks through transparency — the sc-if
// stays a runtime-tree leaf). The contents are therefore UNCONDITIONALLY
// LIVE — a synth inside a hidden sc-if keeps playing, a var keys at the
// enclosing path — only visibility is conditional.

import { nothing, type PropertyValues } from "lit";
import { ScElement } from "@/sc-elements/internal/sc-element";
import "./sc-if.scss";

export class ScIf extends ScElement {
  /** Host attributes are side effects — keep them out of render(). */
  protected willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.toggleAttribute("hidden", !this.getProp("when"));
  }

  render() {
    return nothing;
  }
}
