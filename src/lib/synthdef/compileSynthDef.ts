// Compiles a parsed <sc-synthdef> — params + <sc-ugen> specs in DOM order —
// into SCgf bytes. This is the markup-shaped half of the old app's
// SynthDefCompiler: the registry, operator tables, UGenInput algebra, graph
// validation and SCgf encoding all come from @sc-app/synthdef-compiler; only
// the string-spec → SynthDef translation lives here, because its input shape
// (bind-or-value strings collected from sc-control children) is the
// sc-element markup contract, not a general compiler concern.
//
// MULTICHANNEL EXPANSION (SC semantics): a value is a SIGNAL — one UGenInput
// or a flat array of them. Array params (comma-list values) become control
// ARRAYS; a comma-list or array-yielding reference on a ugen input makes the
// signal an array. VARIADIC inputs (channelsArray/inputArray/envelope)
// flatten their signal into the tail; any OTHER input receiving an array
// EXPANDS the ugen — max(len) instances, each taking wrapAt(signal, i) per
// input — and the ugen's name then resolves to the array of instances, so
// expansion propagates downstream (expressions expand element-wise the same
// way through the op-node lowering).
//
// No topological sort: the parse engine enforces declared-before-referenced
// (an sc-ugen input may only bind an EARLIER sibling or a synthdef param), so
// DOM order is already a valid build order — the package's forward-reference
// validation is the defensive backstop. The ugen's `rate` attribute is taken
// as written (default "ar"); synthesized op nodes infer from their operands.

import {
  SynthDef,
  binaryOpIndex,
  k,
  lookupUgen,
  parseRate,
  u,
  unaryOpIndex,
  uo,
  type Rate,
  type UGenInput,
  type UGenRegistryDefault,
} from "@sc-app/synthdef-compiler";
import { parseBind } from "@/lib/utils/expression";
import type { Expr } from "@/types/runtime";

export interface UgenSpec {
  name: string;
  /** The SuperCollider UGen class (the element's `type` attribute). */
  type: string;
  rate: string; // "ar" | "kr" | "ir" (validated by sc-ugen)
  op?: string;
  /** Input name → bind reference ("osc", "osc:1", "a,b", "freq * 2") or
   *  literal string (a comma-list literal is an array). */
  inputs: Record<string, string>;
}

/** A value in the graph: one input, or a flat array of them (multichannel).
 *  Arrays never nest — comma-lists and array-yielding refs flatten. */
type Signal = UGenInput | UGenInput[];

const OP_TABLES: Record<string, (op: string) => number | null> = {
  BinaryOpUGen: binaryOpIndex,
  UnaryOpUGen: unaryOpIndex,
};

/** VARIADIC tail inputs (SC's array-consuming arguments): their signal
 *  flattens into the wire tail instead of expanding the ugen. `envelope` is
 *  EnvGen's flat Env.asArray run — an array param or comma-list literal. */
const ARRAY_INPUTS: ReadonlySet<string> = new Set(["channelsArray", "inputArray", "envelope"]);

class UGenGraphBuilder {
  /** ugen name → its node index (or the instance indices when expanded). */
  private ugenIndices = new Map<string, number | number[]>();
  /** param name → the control-slot input(s) — an array for array params. */
  private controlInputs = new Map<string, UGenInput | UGenInput[]>();

  constructor(
    private def: SynthDef,
    params: Record<string, number | number[]>,
  ) {
    // All params are kr controls (the package funnels them into one Control
    // UGen with per-param output slots); an array value is a control ARRAY
    // (one name entry, N slots — /n_setn writes the run).
    for (const [name, value] of Object.entries(params)) {
      this.controlInputs.set(
        name,
        Array.isArray(value)
          ? def.addControlArray(name, value, "control")
          : def.addControl(name, value, "control"),
      );
    }
  }

  build(specs: UgenSpec[]): void {
    for (const spec of specs) {
      const entry = lookupUgen(spec.type);
      if (!entry) throw new Error(`Unknown UGen type: "${spec.type}"`);
      const rate = parseRate(spec.rate);
      if (!rate) throw new Error(`Unknown rate: "${spec.rate}"`);

      const numChannelsAttr = findMatchingInput(spec.inputs, "numChannels");
      const numOutputs = numChannelsAttr ? parseInt(numChannelsAttr, 10) : (entry.numOutputs ?? 1);
      const specialIndex = resolveSpecialIndex(spec);
      const { fixed, tail } = this.resolveInputs(spec, entry.defaults);

      // MULTICHANNEL EXPANSION: any fixed input holding an array expands the
      // ugen to max(len) instances, each taking wrapAt(signal, i).
      const widths = fixed.filter((s): s is UGenInput[] => Array.isArray(s)).map((s) => s.length);
      if (widths.length === 0) {
        const idx = this.def.addUgen(
          spec.type,
          rate,
          [...(fixed as UGenInput[]), ...tail],
          numOutputs,
          specialIndex,
        );
        this.ugenIndices.set(spec.name, idx);
        continue;
      }
      if (widths.some((w) => w === 0)) {
        throw new Error(`UGen "${spec.name}" (${spec.type}): empty array input`);
      }
      const count = Math.max(...widths);
      const indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const inputs = fixed.map((signal) =>
          Array.isArray(signal) ? signal[i % signal.length] : signal,
        );
        indices.push(this.def.addUgen(spec.type, rate, [...inputs, ...tail], numOutputs, specialIndex));
      }
      this.ugenIndices.set(spec.name, indices);
    }
  }

  /** The spec's inputs in registry order, registry defaults filling the
   *  gaps: FIXED inputs stay positional signals (the expansion operands);
   *  VARIADIC inputs flatten into the tail. */
  private resolveInputs(
    spec: UgenSpec,
    defaults: UGenRegistryDefault[],
  ): { fixed: Signal[]; tail: UGenInput[] } {
    const fixed: Signal[] = [];
    const tail: UGenInput[] = [];
    for (const { name: defName, default: defValue } of defaults) {
      if (defName === "numChannels") continue; // structural, not a signal input
      const attrValue = findMatchingInput(spec.inputs, defName);

      if (attrValue !== undefined) {
        const signal = this.resolveSignal(attrValue);
        if (ARRAY_INPUTS.has(defName)) {
          tail.push(...(Array.isArray(signal) ? signal : [signal]));
        } else {
          fixed.push(signal);
        }
      } else if (defValue !== null) {
        fixed.push(k(defValue));
      } else {
        throw new Error(`UGen "${spec.name}" (${spec.type}): missing required input "${defName}"`);
      }
    }
    return { fixed, tail };
  }

  /** A raw input string → a Signal: top-level commas make an array (each
   *  token resolved independently, array-yielding tokens flattened); a
   *  single token may itself resolve to an array (an expanded ugen, an
   *  array param, an array expression). */
  private resolveSignal(value: string): Signal {
    const tokens = value.split(",").map((s) => s.trim()).filter((s) => s !== "");
    if (tokens.length > 1) {
      return tokens.flatMap((token) => {
        const signal = this.resolveToken(token);
        return Array.isArray(signal) ? signal : [signal];
      });
    }
    return this.resolveToken(tokens[0] ?? value);
  }

  /** One token → a Signal: a numeric literal, a `name`/`name:idx` reference
   *  (arrays when the target is expanded / an array param), or an arithmetic
   *  expression lowered to op nodes (element-wise over arrays). */
  private resolveToken(value: string): Signal {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== "") return k(num);

    // A strict `name:idx` multi-output ref (not a ternary's ':', which falls
    // through to expression lowering below).
    const colonRef = /^([A-Za-z_][\w-]*):(\d+)$/.exec(value);
    if (colonRef) {
      const base = this.ugenIndices.get(colonRef[1]);
      const outIdx = Number(colonRef[2]);
      if (base === undefined) throw new Error(`Unknown UGen ref: "${colonRef[1]}" in "${value}"`);
      return Array.isArray(base) ? base.map((b) => uo(b, outIdx)) : uo(base, outIdx);
    }

    const idx = this.ugenIndices.get(value);
    if (idx !== undefined) return Array.isArray(idx) ? idx.map(u) : u(idx);

    const ctrl = this.controlInputs.get(value);
    if (ctrl) return ctrl;

    // A bare name matched nothing above; an arithmetic expression lowers into
    // op nodes (a plain unresolved path has no `expression` → falls through).
    const parsed = parseBind(value);
    if (parsed.expression) return this.lowerExpr(parsed.expression);

    throw new Error(`Cannot resolve input "${value}" — not a number, UGen id, or param name`);
  }

  /** The calc rate of an already-built input: a constant is scalar, a ref is
   *  the rate of the node it points at. */
  private rateOf(input: UGenInput): Rate {
    if (input.tag === "constant") return "scalar";
    return this.def.getNodeRate(input.tag === "ugen" ? input.val : input.ugenIdx);
  }

  /** A synthesized op node's rate = the highest of its operands
   *  (audio > control > scalar), matching sclang's rate propagation. */
  private combinedRate(inputs: UGenInput[]): Rate {
    let best: Rate = "scalar";
    for (const input of inputs) {
      const r = this.rateOf(input);
      if (r === "audio") return "audio";
      if (r === "control") best = "control";
    }
    return best;
  }

  private emitUnary(operand: UGenInput, special: number): UGenInput {
    return u(this.def.addUgen("UnaryOpUGen", this.combinedRate([operand]), [operand], 1, special));
  }

  private emitBinary(left: UGenInput, right: UGenInput, special: number): UGenInput {
    return u(
      this.def.addUgen(
        "BinaryOpUGen",
        this.combinedRate([left, right]),
        [left, right],
        1,
        special,
      ),
    );
  }

  /** Lower a parsed bind expression into UGen nodes, multichannel-expanded:
   *  ops over array signals emit one op node per element with the shorter
   *  operand cycling (SC's wrap). Operand vars resolve through resolveToken
   *  (params/sibling ugens, arrays included). */
  private lowerExpr(expr: Expr): Signal {
    switch (expr.type) {
      case "number":
        return k(expr.value);
      case "var":
        return this.resolveToken(expr.name);
      case "unary": {
        const operand = this.lowerExpr(expr.expr);
        const special = unaryOpIndex("neg")!;
        return Array.isArray(operand)
          ? operand.map((o) => this.emitUnary(o, special))
          : this.emitUnary(operand, special);
      }
      case "binary": {
        const special = binaryOpIndex(expr.op);
        if (special === null) throw new Error(`unsupported operator "${expr.op}" in expression`);
        const left = this.lowerExpr(expr.left);
        const right = this.lowerExpr(expr.right);
        if (!Array.isArray(left) && !Array.isArray(right)) {
          return this.emitBinary(left, right, special);
        }
        const la = Array.isArray(left) ? left : [left];
        const ra = Array.isArray(right) ? right : [right];
        const count = Math.max(la.length, ra.length);
        return Array.from({ length: count }, (_, i) =>
          this.emitBinary(la[i % la.length], ra[i % ra.length], special),
        );
      }
      case "string":
        throw new Error(`a string literal is not allowed in a synthdef graph expression`);
      case "ternary":
        throw new Error(`a ternary is not supported in a synthdef graph expression`);
    }
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
  params: Record<string, number | number[]>,
  specs: UgenSpec[],
): Uint8Array {
  if (specs.length === 0) {
    throw new Error(`<sc-synthdef name="${name}"> has no <sc-ugen> children`);
  }
  const def = new SynthDef(name);
  new UGenGraphBuilder(def, params).build(specs);
  return def.toBytes();
}
