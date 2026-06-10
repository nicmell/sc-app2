// Base for the stateful elements (sc-control / sc-var): a named value binds
// can target. The `name`/`value`/`bind` attributes, their shared validation
// (value xor bind), and the state runtime — the live `value` (the resolved
// literal, or 0 while bound) plus `targets`/`expression` when bound. The
// subclasses differ only in when they're enabled: a control is enabled when
// its parent is a node (a pure graph input inside synthdefs/ugens), a var
// always.

import { property } from "lit/decorators.js";
import type { Expr, RuntimeContext, StateRuntime } from "@/types/runtime";
import { baseRuntime, failValidation, requireNumeric, requireProp, resolveStateBind } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export abstract class ScState extends ScElement {
  @property() accessor name = "";
  @property() accessor bind: string | undefined = undefined;
  @property({ type: Number }) accessor value: number | undefined = undefined;

  /** Bind path → the live target state element (set when bound). */
  targets?: Record<string, ScState>;
  /** Parsed arithmetic bind expression, when the bind isn't a plain path. */
  expression?: Expr;

  validate(): void {
    requireProp(this, "name", this.name);
    if (this.bind !== undefined && this.value !== undefined) {
      failValidation(this, `"value" and "bind" are mutually exclusive`);
    }
    requireNumeric(this, "value", this.value);
  }

  /** Resolve the literal/bound value into the live `value` property. Only
   *  enabled state resolves its bind and gets the normalized live value —
   *  disabled state (a pure graph input inside synthdefs/ugens) keeps the
   *  prop as the plain attribute mirror, so the graph collection can still
   *  tell a missing `value` attribute apart. */
  protected stateRuntime(ctx: RuntimeContext, enabled: boolean): StateRuntime {
    if (!enabled) {
      return { ...baseRuntime(ctx), enabled };
    }
    if (this.bind) {
      const { targets, expression } = resolveStateBind(this, ctx, this.bind);
      return { ...baseRuntime(ctx), enabled, value: 0, targets, expression };
    }
    return { ...baseRuntime(ctx), enabled, value: this.value ?? 0 };
  }
}
