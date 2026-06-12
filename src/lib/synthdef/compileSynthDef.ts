// Compiles a parsed <sc-synthdef> — params + <sc-ugen> specs in DOM order —
// into SCgf bytes. This is the markup-shaped half of the old app's
// SynthDefCompiler: the registry, operator tables, UGenInput algebra, graph
// validation and SCgf encoding all come from @sc-app/synthdef-compiler; only
// the string-spec → SynthDef translation lives here, because its input shape
// (bind-or-value strings collected from sc-control children) is the
// sc-element markup contract, not a general compiler concern.
//
// No topological sort: the parse engine enforces declared-before-referenced
// (an sc-ugen input may only bind an EARLIER sibling or a synthdef param), so
// DOM order is already a valid build order — the package's forward-reference
// validation is the defensive backstop. The ugen's `rate` attribute is taken
// as written (default "ar"); there is no sclang-style rate inference from the
// operands — old-app parity.

import {
  SynthDef,
  binaryOpIndex,
  k,
  lookupUgen,
  parseRate,
  u,
  unaryOpIndex,
  uo,
  type UGenInput,
  type UGenRegistryDefault,
} from "@sc-app/synthdef-compiler";

export interface UgenSpec {
  name: string;
  /** The SuperCollider UGen class (the element's `type` attribute). */
  type: string;
  rate: string; // "ar" | "kr" | "ir" (validated by sc-ugen)
  op?: string;
  /** Input name → bind reference ("osc", "osc:1", "a,b") or literal string. */
  inputs: Record<string, string>;
}

const OP_TABLES: Record<string, (op: string) => number | null> = {
  BinaryOpUGen: binaryOpIndex,
  UnaryOpUGen: unaryOpIndex,
};

/** channelsArray/inputArray are appended last in the SCgf wire order
 *  (SC's `multiNewList` behavior), regardless of their registry position. */
const ARRAY_INPUTS: ReadonlySet<string> = new Set(["channelsArray", "inputArray"]);

class UGenGraphBuilder {
  /** ugen name → its node index in the def. */
  private ugenIndices = new Map<string, number>();
  /** param name → the control-slot input. */
  private controlInputs = new Map<string, UGenInput>();

  constructor(
    private def: SynthDef,
    params: Record<string, number>,
  ) {
    // All params are kr controls (the package funnels them into one Control
    // UGen with per-param output slots), matching the old compiler.
    for (const [name, value] of Object.entries(params)) {
      this.controlInputs.set(name, def.addControl(name, value, "control"));
    }
  }

  build(specs: UgenSpec[]): void {
    for (const spec of specs) {
      const entry = lookupUgen(spec.type);
      if (!entry) throw new Error(`Unknown UGen type: "${spec.type}"`);
      const rate = parseRate(spec.rate);
      if (!rate) throw new Error(`Unknown rate: "${spec.rate}"`);

      const numChannelsAttr = findMatchingInput(spec.inputs, "numChannels");
      const numOutputs = numChannelsAttr
        ? parseInt(numChannelsAttr, 10)
        : (entry.numOutputs ?? 1);
      const inputs = this.resolveStandardInputs(spec, entry.defaults);
      const specialIndex = resolveSpecialIndex(spec);
      this.ugenIndices.set(
        spec.name,
        this.def.addUgen(spec.type, rate, inputs, numOutputs, specialIndex),
      );
    }
  }

  /** The spec's inputs in registry order, registry defaults filling the
   *  gaps; array inputs (comma-separated refs) collect at the tail. */
  private resolveStandardInputs(spec: UgenSpec, defaults: UGenRegistryDefault[]): UGenInput[] {
    const result: UGenInput[] = [];
    const arrayInputs: UGenInput[] = [];
    for (const { name: defName, default: defValue } of defaults) {
      if (defName === "numChannels") continue; // structural, not a signal input
      const attrValue = findMatchingInput(spec.inputs, defName);

      if (attrValue !== undefined) {
        if (ARRAY_INPUTS.has(defName)) {
          for (const ref of attrValue.split(",").map((s) => s.trim())) {
            arrayInputs.push(this.resolveInput(ref));
          }
        } else {
          result.push(this.resolveInput(attrValue));
        }
      } else if (defValue !== null) {
        result.push(k(defValue));
      } else {
        throw new Error(`UGen "${spec.name}" (${spec.type}): missing required input "${defName}"`);
      }
    }
    return [...result, ...arrayInputs];
  }

  /** A literal number, a sibling-ugen reference (`name` for output 0,
   *  `name:idx` for a specific output), or a synthdef param. */
  private resolveInput(value: string): UGenInput {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== "") return k(num);

    if (value.includes(":")) {
      const [refId, indexStr] = value.split(":");
      const idx = this.ugenIndices.get(refId);
      if (idx !== undefined) return uo(idx, parseInt(indexStr, 10));
      throw new Error(`Unknown UGen ref: "${refId}" in "${value}"`);
    }

    const idx = this.ugenIndices.get(value);
    if (idx !== undefined) return u(idx);

    const ctrl = this.controlInputs.get(value);
    if (ctrl) return ctrl;

    throw new Error(`Cannot resolve input "${value}" — not a number, UGen id, or param name`);
  }
}

function resolveSpecialIndex(spec: UgenSpec): number {
  const opIndex = OP_TABLES[spec.type];
  if (!opIndex) return 0;
  if (!spec.op) throw new Error(`${spec.type} "${spec.name}" requires an "op" attribute`);
  const idx = opIndex(spec.op);
  if (idx === null) throw new Error(`${spec.type} "${spec.name}": unknown operator "${spec.op}"`);
  return idx;
}

/** Case-insensitive input lookup — load-bearing: markup writes
 *  `channelsarray` while the registry spells `channelsArray`. */
function findMatchingInput(inputs: Record<string, string>, paramName: string): string | undefined {
  const lower = paramName.toLowerCase();
  for (const [key, value] of Object.entries(inputs)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

/** Compile a synthdef from parsed-markup specs. `specs` MUST be in DOM
 *  order. Throws on any unresolvable graph — a parse-time failure for the
 *  declaring plugin. */
export function compileSynthDef(
  name: string,
  params: Record<string, number>,
  specs: UgenSpec[],
): Uint8Array {
  if (specs.length === 0) {
    throw new Error(`<sc-synthdef name="${name}"> has no <sc-ugen> children`);
  }
  const def = new SynthDef(name);
  new UGenGraphBuilder(def, params).build(specs);
  return def.toBytes();
}
