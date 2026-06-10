// <sc-display> — a read-only formatted view of a bound control/var. Stub:
// value rendering arrives with the inputs migration step.

import { property } from "lit/decorators.js";
import type { ScDisplayRuntime, ScDisplayProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScDisplay extends ScElement<ScDisplayRuntime> implements ScDisplayProps {
  @property() accessor bind = "";
  @property() accessor format = "";

  validate(): void {
    this.requireProp("bind", this.bind);
  }
}
