// <sc-if> — conditional rendering keyed on a bound control/var (is-truthy /
// is-falsy / is-equal / … attributes, XSD-allowed, not declared yet). Stub:
// children always render; the condition logic arrives with the inputs
// migration step.

import { property } from "lit/decorators.js";
import type { ScIfRuntime, ScIfProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScIf extends ScElement<ScIfRuntime> implements ScIfProps {
  @property() accessor bind = "";

  validate(): void {
    this.requireProp("bind", this.bind);
  }
}
