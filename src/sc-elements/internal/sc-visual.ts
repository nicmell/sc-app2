// Base for the read-only expression visuals (the visuals/ category:
// sc-display / sc-if): a `bind` that is a full evaluable expression over the
// state graph — the same resolveStateBind machinery bound controls/vars use
// (plain paths, arithmetic, comparisons) — feeding a reactive `_value` the
// subclass renders from. A visual is a SINK on the graph: no name, no store
// key, no writes. The WRITING inputs (sc-range/sc-checkbox/sc-select/
// sc-radio-group/sc-run) stay on internal/sc-input's single writable
// `_targetScNode` instead — an expression is not a writable target.

import { property, state } from "lit/decorators.js";
import type { DerivedRuntime, Expr, RuntimeContext } from "@/types/runtime";
import { baseRuntime, resolveStateBind } from "@/sc-elements/internal/validation";
import { observeDerived } from "@/sc-elements/internal/derived";
import { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";

export abstract class ScVisual extends ScElement {
  @property() accessor bind = "";

  /** Bind path → the live target state element. */
  targets?: Record<string, ScState>;
  /** Parsed bind expression, when the bind isn't a plain path. */
  expression?: Expr;

  /** The live derived value the subclass renders from. */
  @state() accessor _value: number | undefined = undefined;

  private offValue?: () => void;

  protected resolveRuntime(ctx: RuntimeContext): DerivedRuntime {
    const { targets, expression } = resolveStateBind(this, ctx, this.bind);
    return { ...baseRuntime(ctx), targets, expression };
  }

  /** Wire the derived observer into `_value`. Re-entrant (reconnect reload):
   *  the stale subscription is dropped first. */
  async load(): Promise<void> {
    this.offValue?.();
    this.offValue = undefined;
    if (this.targets) {
      this.offValue = observeDerived(this.targets, this.expression, (v) => (this._value = v));
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
}
