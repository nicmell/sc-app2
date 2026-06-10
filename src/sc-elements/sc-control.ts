// <sc-control> — a named parameter: a literal `value` or a `bind` reference
// (mutually exclusive, enforced by the parser). Stub: parsing/validation only;
// /n_set propagation arrives with the controls migration step.

import type { ScControlItem } from "@/types/parsers";
import { ScElement } from "./internal/sc-element";

export class ScControl extends ScElement<ScControlItem> {}
