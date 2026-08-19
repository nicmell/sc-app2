// <sc-var> — a state variable: like sc-control (the props/validation/store
// seam/propagation live on the ScState/ScElement bases) but always LIVE
// and never sent over OSC — a literal var is a store-backed key writes reach
// through the base's plain store dispatch (and may hold a STRING: its `value`
// is a scalar); a derived var (`bind:value`) computes its `_state` from its
// targets (no store key) and is read-only.
//
// A var must be declared ON A NODE (plugin/group/synth): its store key is its
// named-ancestor path, and a path-transparent container (sc-if, sc-select,
// sc-radio-group — no path segment of their own) would let a same-named var
// silently share an outer var's key. A control off a node is legal
// synthdef-plane data; vars enforce the rule as a parse error.

import { isNodeRuntime } from "@/lib/utils/guards";
import { failValidation } from "@/sc-elements/internal/validation";
import { ScState } from "@/sc-elements/internal/sc-state";

export class ScVar extends ScState {
  validate(): void {
    super.validate();
    // A var whose parent is not a node (inside a synthdef) has no store
    // path to key under — the runtime gate the XSD content model only
    // mirrors at upload.
    if (!this._parentScNode || !isNodeRuntime(this._parentScNode)) {
      failValidation(this, "must be declared on a node");
    }
  }
}
