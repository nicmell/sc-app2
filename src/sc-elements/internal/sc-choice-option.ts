// Base for pure-data choice children (sc-option / sc-radio). They are
// collected by their parent input during parsing and are never enabled.

import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import { ScElement } from "@/sc-elements/internal/sc-element";
import { baseRuntime } from "@/sc-elements/internal/validation";

/** Shared runtime implementation for declarative choice children. */
export abstract class ScChoiceOption extends ScElement {
  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return { ...baseRuntime(ctx), enabled: false };
  }
}
