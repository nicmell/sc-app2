// <sc-group> — a named container node: its synths/groups live in a scsynth
// group of their own. Stub: /g_new + /g_freeAll arrive with the groups
// migration step.

import { property } from "lit/decorators.js";
import type { ScGroupItem, ScGroupProps } from "@/types/parsers";
import { runAttribute, ScElement } from "./internal/sc-element";

export class ScGroup extends ScElement<ScGroupItem> implements ScGroupProps {
  @property() accessor name = "";
  @property(runAttribute) accessor run = true;

  validate(): void {
    this.requireProp("name", this.name);
  }
}
