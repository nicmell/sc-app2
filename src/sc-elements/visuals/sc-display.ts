// <sc-display> — a read-only formatted view of a bound control/var
// (`bind`/`targetId` on the ScInput base). Stub: value rendering arrives with
// the inputs migration step.

import { property } from "lit/decorators.js";
import type { ScDisplayProps } from "@/types/runtime";
import { requireProp } from "@/sc-elements/internal/validation";
import { ScInput } from "@/sc-elements/internal/sc-input";

export class ScDisplay extends ScInput implements ScDisplayProps {
  @property() accessor format = "";

  validate(): void {
    requireProp(this, "bind", this.bind);
  }
}
