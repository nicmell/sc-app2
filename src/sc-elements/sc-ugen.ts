// <sc-ugen> — one UGen node inside an sc-synthdef (sc-control children are its
// inputs). Stub: parsing/validation only; the graph builder consumes these
// items in the UGen migration step.

import type { ScUgenItem } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScUgen extends ScElement<ScUgenItem> {}
