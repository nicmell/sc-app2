// <sc-run> — a play/pause control for a node (`bind` targets a synth/group by
// name; empty targets the parent node). Stub: /n_run arrives with the inputs
// migration step. Presentational attributes (size/src/colors) are XSD-allowed
// but not declared yet.

import { property } from "lit/decorators.js";
import type { ScRunRuntime, ScRunProps } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRun extends ScElement<ScRunRuntime> implements ScRunProps {
  @property() accessor bind = "";
}
