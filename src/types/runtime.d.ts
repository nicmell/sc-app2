import type { UgenSpec } from "@/lib/synthdef/compileSynthDef";
import type { ScElement, ScParentElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";

// The engine's type system. There are NO item structures and NO parallel
// attribute interfaces: the element IS the runtime — `process()` resolves the
// runtime values and assigns them onto the component, where they're declared
// as plain fields (ScElement base + the internal/ category bases) next to the
// HTML attributes' decorated reactive properties (the component class IS the
// attribute contract). The runtime registry maps ids straight to the live
// elements.

// ── Bind expressions (lib/utils/expression) ──────────────────────────────

/** What a runtime value can hold: numbers everywhere, strings for the
 *  presentation layer (string vars, ternary labels/icons). The OSC boundary
 *  stays numeric — senders coerce and skip NaN. */
export type StateValue = number | string;

export type Expr =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "var"; name: string }
  | { type: "unary"; op: "-"; expr: Expr }
  | {
      type: "binary";
      /** Arithmetic, plus the non-associative comparisons (evaluating to 1/0). */
      op: "+" | "-" | "*" | "/" | ">" | "<" | ">=" | "<=" | "==" | "!=";
      left: Expr;
      right: Expr;
    }
  | {
      type: "ternary";
      /** Right-associative conditional over the cond's truthiness. */
      cond: Expr;
      then: Expr;
      else: Expr;
    };

// ── Runtime value mixins ──────────────────────────────────────────────────
//
// What `resolveRuntime` returns and `process()` assigns onto the element;
// the bases declare the matching properties. Values that would duplicate a
// reactive property are unified with it instead: there is no runtime `name`
// or `run` (read the props), and a state element's resolved value lives in
// its `value` prop.

export interface BaseRuntime {
  /** The plugin root element this element was parsed under. */
  _rootScNode: ScElement;
  /** The parsed parent element (unset at the root). */
  _parentScNode?: ScParentElement;
  path: string[];
  enabled: boolean;
}

export interface NodeRuntime extends BaseRuntime {
  loaded: boolean;
  nodeId: number;
}

/** One resolved runtime prop (`bind:min="vars.lo"`, `bind:value="osc.freq * 2"`):
 *  the live bind targets + the optional parsed expression over them. Every
 *  element carries `runtimeProps?: Record<name, RuntimeProp>` (keyed by the
 *  UNPREFIXED attribute name), resolved by the ScElement base in `process()`
 *  for each spec attr not opted out (`runtime: false`) whose `bind:` form is
 *  present. The
 *  LIVE evaluated values feed `getProp` (and, for `value`, the element's
 *  `_state`), recomputed on the targets' statechange. */
export interface RuntimeProp {
  /** Bind path → the live target state element. */
  targets: Record<string, ScState>;
  /** Parsed bind expression, when the bind isn't a plain path. */
  expression?: Expr;
}

export interface SynthDefRuntime extends BaseRuntime {
  loaded: boolean;
  /** The param defaults + DOM-ordered ugen specs (collected at parse) —
   *  compiled to SCgf right at /d_recv time in the load pass. */
  params: Record<string, number>;
  specs: UgenSpec[];
}

export interface InputRuntime extends BaseRuntime {
  /** The live bound target (a state element; a node for sc-run). */
  _targetScNode?: ScElement;
}

/** The per-LEVEL parse state threaded through the elements' `process(ctx)`
 *  recursion (sc-elements/internal ScElement) — all siblings share one
 *  context. `nodes` is the per-parse set of processed elements (the
 *  idempotence/forward-ref guard; the registry adopts the tree from the root
 *  on success), `scope` the cumulative bind-resolution scope. Store-key
 *  uniqueness needs no global map: enabled state must be declared on a node
 *  (vars validate it; controls encode it in their enablement), and sc-if
 *  rejects node descendants — so path-transparent containers can never
 *  smuggle in a colliding key. */
export interface RuntimeContext {
  rootNode: ScElement;
  nodes: Set<ScElement>;
  scope: ScElement[];
  parentNode?: ScParentElement;
  path: string[];
}
