/**
 * The UGen registry — read straight from the committed spec at
 * `assets/specs/ugens.json` (repo root; the SAME file the crate's build.rs
 * compiles the Rust registry and typed builders from) and normalized to
 * the shapes the app has always consumed (lowercase long rate names,
 * `{name, default}` records).
 */

import rawSpec from "../../../assets/specs/ugens.json";
import type { Rate } from "./rate.js";

/** The shape of `assets/specs/ugens.json` (see the sc-spec-types crate —
 *  the serde schema is the authority; this mirrors what the registry
 *  consumes). */
interface UgensSpec {
  categories: {
    name: string;
    ugens: {
      name: string;
      rates: ("ar" | "kr" | "ir")[];
      numOutputs: number | { fromArg: string } | null;
      summary?: string;
      doc?: string;
      signalRange?: string;
      extends?: string;
      noBuilder?: boolean;
      buildOrder?: string[];
      args: {
        name: string;
        kind?: "input" | "inputArray" | "u32";
        default: number | null;
        doc?: string;
      }[];
    }[];
  }[];
}

const spec = rawSpec as UgensSpec;

export interface UGenRegistryDefault {
  name: string;
  default: number | null;
}

export interface UGenRegistryEntry {
  name: string;
  rates: Rate[];
  /** Declared param order (variadic tails reordered at compile time). */
  defaults: UGenRegistryDefault[];
  numOutputs: number | null;
  extends: string | null;
  summary: string | null;
  doc: string | null;
  signalRange: string | null;
  argDocs: [string, string][];
}

const RATE: Record<string, Rate> = { ar: "audio", kr: "control", ir: "scalar" };

const CATEGORIES: [string, UGenRegistryEntry[]][] = spec.categories.map((category) => [
  category.name,
  category.ugens.map((u) => ({
    name: u.name,
    rates: u.rates.map((r) => RATE[r]),
    defaults: u.args.map((a) => ({ name: a.name, default: a.default ?? null })),
    // A `{ fromArg }` count is runtime builder state — no static count,
    // like the Rust registry.
    numOutputs: typeof u.numOutputs === "number" ? u.numOutputs : null,
    extends: u.extends ?? null,
    summary: u.summary ?? null,
    doc: u.doc ?? null,
    signalRange: u.signalRange ?? null,
    argDocs: u.args.flatMap((a): [string, string][] => (a.doc ? [[a.name, a.doc]] : [])),
  })),
]);

const BY_NAME = new Map<string, UGenRegistryEntry>();
for (const [, entries] of CATEGORIES) {
  for (const e of entries) BY_NAME.set(e.name, e);
}

/** Look up a UGen by its canonical class name. `null` if unknown. */
export function lookupUgen(name: string): UGenRegistryEntry | null {
  return BY_NAME.get(name) ?? null;
}

/** The full registry, grouped by source category. */
export function ugensByCategory(): readonly [string, UGenRegistryEntry[]][] {
  return CATEGORIES;
}
