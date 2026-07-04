// <sc-if> — conditional rendering keyed on a bound control/var (is-truthy /
// is-falsy / is-equal / … attributes, XSD-allowed, not declared yet;
// `bind`/`targetId` on the ScInput base). Stub: children always render; the
// condition logic arrives with the inputs migration step.

import type { InputRuntime, RuntimeContext } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScIf extends ScInput {
  validate(): void {
    requireProp(this, "bind", this.bind);
  }

  protected resolveRuntime(ctx: RuntimeContext): InputRuntime {
    this.processChildren(ctx);
    return super.resolveRuntime(ctx);
  }
}
