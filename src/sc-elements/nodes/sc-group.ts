// <sc-group> — a named container node: its synths/groups live in a scsynth
// group of their own. Stub: /g_new + /g_freeAll arrive with the groups
// migration step.

import { property } from "lit/decorators.js";
import type { ScGroupProps } from "@/types/runtime";
import { ScNode } from "@/sc-elements/internal/sc-node";

export class ScGroup extends ScNode implements ScGroupProps {
  @property() accessor name = "";

  validate(): void {
    this.requireProp("name", this.name);
  }
}
