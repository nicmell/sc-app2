// <sc-run> — a play/pause control for a node (`bind` targets a synth/group by
// name; empty targets the parent node). Stub: /n_run arrives with the inputs
// migration step. Presentational attributes (size/src/colors) are XSD-allowed
// but not declared yet.

import { property } from "lit/decorators.js";
import type { ScRunItem, ScRunProps } from "@/types/parsers";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScRun extends ScElement<ScRunItem> implements ScRunProps {
  @property() accessor bind = "";
}
