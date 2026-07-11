// <sc-env> — a declarative envelope inside an EnvGen <sc-ugen>: pure data
// (shape + times/levels), collected by the enclosing sc-synthdef at parse and
// encoded into EnvGen's `envelope` input. Consumed by the parent, never enabled.

import { type EnvSpec, envAdsr, envAsr, envPerc } from "@sc-app/synthdef-compiler";
import type { BaseRuntime, RuntimeContext } from "@/types/runtime";
import { baseRuntime, failValidation, requireNoScChildren } from "@/sc-elements/internal/validation";
import { ScElement } from "@/sc-elements/internal/sc-element";

export class ScEnv extends ScElement {
  validate(): void {
    requireNoScChildren(this);
    // `shape` membership + numeric NaN are enforced by validateProps; guard the
    // one semantic rule: positive segment times.
    for (const name of ["attack", "decay", "release"] as const) {
      const v = this.getProp(name) as number | undefined;
      if (v !== undefined && !(v >= 0)) {
        failValidation(this, `"${name}" attribute must be a non-negative number (got "${v}")`);
      }
    }
  }

  protected resolveRuntime(ctx: RuntimeContext): BaseRuntime {
    return { ...baseRuntime(ctx), enabled: false };
  }

  /** The parsed envelope, built from the shape + its attributes. Undefined
   *  attributes fall back to the SC defaults in the shape helpers. */
  toEnvSpec(): EnvSpec {
    const num = (name: string): number | undefined => this.getProp(name) as number | undefined;
    const curve = this.getProp("curve") as number | string | undefined;
    const shape = this.getProp("shape") as string;
    const common = { curve };
    switch (shape) {
      case "perc":
        return envPerc({ attack: num("attack"), release: num("release"), level: num("level"), ...common });
      case "asr":
        return envAsr({
          attack: num("attack"),
          sustain: num("sustain"),
          release: num("release"),
          ...common,
        });
      default:
        return envAdsr({
          attack: num("attack"),
          decay: num("decay"),
          sustain: num("sustain"),
          release: num("release"),
          peak: num("peak"),
          ...common,
        });
    }
  }
}
