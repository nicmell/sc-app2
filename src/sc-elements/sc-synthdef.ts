// <sc-synthdef> — declares a synth graph (sc-control + sc-ugen children).
// Stub: parsing/validation only; compilation + /d_recv arrive with the
// synthdef migration step.

import type { ScSynthDefItem } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScSynthDef extends ScElement<ScSynthDefItem> {}
