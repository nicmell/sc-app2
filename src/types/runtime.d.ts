import type { ELEMENTS } from "@/constants/sc-elements";
import type { ScElement, ScParentElement } from "@/sc-elements/internal/sc-element";

// The runtime type system. There are NO item structures: the element IS the
// runtime — `process()` resolves the runtime values and assigns them onto the
// component, where they're declared as plain fields (ScElement base + the
// internal/ category bases), next to the HTML attributes' reactive properties
// (the per-element `Props` interfaces below). The runtime registry maps ids
// straight to the live elements.

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
  /** Bind path → the target state element's id. */
  targets?: Record<string, string>;
  /** Parsed arithmetic bind expression, when the bind isn't a plain path. */
  expression?: Expr;
}

export interface SynthDefRuntime extends BaseRuntime {
  loaded: boolean;
}

export interface InputRuntime extends BaseRuntime {
  targetId: string;
}

// ── Element props (the components' reactive properties) ──────────────────

export interface ScPluginProps {
  run: boolean;
}

export interface ScSynthDefProps {
  name: string;
}

export interface ScUgenProps {
  name: string;
  /** The SuperCollider UGen class (the element's `type` attribute). */
  ugen: string;
  rate: string;
  /** Operator for BinaryOpUGen / UnaryOpUGen. */
  op?: string;
}

export interface ScControlProps {
  name: string;
  /** Literal value — NaN/unset when `bind` is used. */
  value?: number;
  /** Reference to another control by name — unset when `value` is used. */
  bind?: string;
}

export interface ScSynthProps {
  name: string;
  /** The sc-synthdef this synth instantiates. */
  bind: string;
  run: boolean;
}

export interface ScRangeProps {
  bind: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface ScGroupProps {
  name: string;
  run: boolean;
}

export interface ScVarProps {
  name: string;
  /** Literal value — NaN/unset when `bind` is used. */
  value?: number;
  /** Reference (or arithmetic expression over references) — unset with `value`. */
  bind?: string;
}

export interface ScRunProps {
  /** Target node by name — empty targets the parent node. */
  bind: string;
}

export interface ScDisplayProps {
  bind: string;
  /** Printf-style format (%d, %.2f, %b, %s). */
  format: string;
}

export interface ScIfProps {
  bind: string;
}

export interface ScSelectProps {
  bind: string;
}

export interface ScOptionProps {
  value: number;
  label: string;
}

export interface ScRadioGroupProps {
  bind: string;
  orientation: "horizontal" | "vertical";
}

export interface ScRadioProps {
  value: number;
  label: string;
}

export interface ScCheckboxProps {
  bind: string;
}

export type NodeType = (typeof ELEMENTS)[keyof typeof ELEMENTS];

/** The per-LEVEL parse state threaded through the elements' `process(ctx)`
 *  recursion (sc-elements/internal ScElement) — all siblings share one
 *  context. `nodes` is the per-parse id → element map (adopted by the runtime
 *  registry on success), `scope` the cumulative bind-resolution scope. */
export interface RuntimeContext {
  rootNode: ScElement;
  nodes: Map<string, ScElement>;
  scope: ScElement[];
  parentNode?: ScParentElement;
  path: string[];
}
