/**
 * The UGen registry — served by the wasm build (one `registryJson()` call
 * at module load, cached here) and normalized to the shapes the app has
 * always consumed (lowercase long rate names, `{name, default}` records).
 * The data itself lives once, in the crate's reconciled specs.
 */

import { registryJson } from "./component.js";
import type { Rate } from "./rate.js";

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

interface RawEntry extends Omit<UGenRegistryEntry, "rates" | "defaults"> {
  rates: string[];
  defaults: [string, number | null][];
}

const CATEGORIES: [string, UGenRegistryEntry[]][] = (
  JSON.parse(registryJson()) as [string, RawEntry[]][]
).map(([category, entries]) => [
  category,
  entries.map((e) => ({
    ...e,
    rates: e.rates.map((r) => r.toLowerCase() as Rate),
    defaults: e.defaults.map(([name, d]) => ({ name, default: d })),
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
