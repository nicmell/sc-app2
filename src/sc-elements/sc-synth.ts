// <sc-synth> — a synth instance of an sc-synthdef (referenced by `bind`),
// with sc-control children as its parameters. Stub: parsing/validation only;
// /s_new in the plugin group arrives with the synth migration step.

import type { ScSynthItem } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScSynth extends ScElement<ScSynthItem> {}
