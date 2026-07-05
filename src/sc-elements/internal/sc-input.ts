// Base for the WRITING bind-targeting inputs (sc-range / sc-checkbox /
// sc-select / sc-radio-group / sc-run): the `bind` attribute plus the
// resolved `_targetScNode` runtime reference — a single writable target (an
// expression is not writable; the read-only visuals live on
// internal/sc-visual instead). The default runtime resolves the visual bind
// to a state element; subclasses override it where they parse children first
// (select/radio-group) or target a node instead (sc-run). Each subclass
// keeps its own validate() — bind is not required everywhere (sc-range,
// sc-run).

import { property } from "lit/decorators.js";
import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { resolveVisualBind } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScInput extends ScElement {
  @property() accessor bind = "";

  /** The live bound target (a state element; a node for sc-run). */
  _targetScNode?: ScElement;

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    return resolveVisualBind(this, ctx, this.bind);
  }
}
