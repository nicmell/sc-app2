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

export type Expr =
  | { type: "number"; value: number }
  | { type: "var"; name: string }
  | { type: "unary"; op: "-"; expr: Expr }
  | { type: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr };

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

export interface StateRuntime extends BaseRuntime {
  /** The live value: the resolved literal, or 0 while bound. Only assigned
   *  on ENABLED state — disabled graph inputs keep the prop as the plain
   *  attribute mirror. */
  value?: number;
  /** Bind path → the live target state element. */
  targets?: Record<string, ScState>;
  /** Parsed arithmetic bind expression, when the bind isn't a plain path. */
  expression?: Expr;
}

export interface SynthDefRuntime extends BaseRuntime {
  loaded: boolean;
}

export interface InputRuntime extends BaseRuntime {
  /** The live bound target (a state element; a node for sc-run). */
  _targetScNode?: ScElement;
}

/** The per-LEVEL parse state threaded through the elements' `process(ctx)`
 *  recursion (sc-elements/internal ScElement) — all siblings share one
 *  context. `nodes` is the per-parse set of processed elements (the
 *  idempotence/forward-ref guard; the registry adopts the tree from the root
 *  on success), `scope` the cumulative bind-resolution scope. */
export interface RuntimeContext {
  rootNode: ScElement;
  nodes: Set<ScElement>;
  scope: ScElement[];
  parentNode?: ScParentElement;
  path: string[];
}
