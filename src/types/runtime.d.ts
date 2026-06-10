import type { ELEMENTS } from "@/constants/sc-elements";

// The plugin element-tree type system. Runtime items carry only what the
// parser and runtime processor infer — identity (`id`), structure
// (`children`), the processor-resolved runtime values (merged directly into
// the item), and `_element`: the mounted web component itself. The HTML
// attributes live as reactive properties ON the component (typed here as the
// per-element `Props` interfaces the components implement), so nothing is
// duplicated into the items: read them through `_element`.

// ── Bind expressions (lib/utils/expression) ──────────────────────────────

export type Expr =
  | { type: "number"; value: number }
  | { type: "var"; name: string }
  | { type: "unary"; op: "-"; expr: Expr }
  | { type: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr };

// ── Runtime value mixins (what the handlers resolve per element) ──────────

export interface BaseRuntime {
  rootId: string;
  parentId: string;
  path: string[];
  enabled: boolean;
}

export interface NodeRuntime extends BaseRuntime {
  run: number;
  loaded: boolean;
  nodeId: number;
}

export interface ControlRuntime extends BaseRuntime {
  name: string;
  value: number;
  /** Bind path → the target state item's id. */
  targets?: Record<string, string>;
  /** Parsed arithmetic bind expression, when the bind isn't a plain path. */
  expression?: Expr;
}

export interface VarRuntime extends BaseRuntime {
  name: string;
  value: number;
  targets?: Record<string, string>;
  expression?: Expr;
}

export interface UgenRuntime extends BaseRuntime {}

export interface SynthDefRuntime extends BaseRuntime {
  loaded: boolean;
}

export interface InputRuntime extends BaseRuntime {
  targetId: string;
}

export interface RunRuntime extends BaseRuntime {
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

// ── Runtime items ─────────────────────────────────────────────────────────
//
// Each item IS its runtime: identity + `_element` + the matching runtime
// mixin, merged flat (no nested `runtime` object). There is no `type` field:
// the discriminant IS the element's tag — `typeOf(item)` (lib/utils/guards)
// derives it from `_element.tagName`. `hydrate` produces the bare
// ScElementRuntimeBase shape; `processElement` merges the resolved runtime
// values into it.

export interface ScElementRuntimeBase {
  id: string;
  /** The mounted web component this item was hydrated from — its reactive
   *  properties ARE the element's HTML attributes. */
  _element: Element;
}

export interface ScPluginRuntime extends ScElementRuntimeBase, NodeRuntime {
  _element: Element & ScPluginProps;
  children: ScElementRuntime[];
}

export interface ScSynthDefRuntime extends ScElementRuntimeBase, SynthDefRuntime {
  _element: Element & ScSynthDefProps;
  children: ScElementRuntime[];
}

export interface ScUgenRuntime extends ScElementRuntimeBase, UgenRuntime {
  _element: Element & ScUgenProps;
  children: ScElementRuntime[];
}

export interface ScControlRuntime extends ScElementRuntimeBase, ControlRuntime {
  _element: Element & ScControlProps;
}

export interface ScSynthRuntime extends ScElementRuntimeBase, NodeRuntime {
  _element: Element & ScSynthProps;
  children: ScElementRuntime[];
}

export interface ScRangeRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScRangeProps;
}

export interface ScGroupRuntime extends ScElementRuntimeBase, NodeRuntime {
  _element: Element & ScGroupProps;
  children: ScElementRuntime[];
}

export interface ScVarRuntime extends ScElementRuntimeBase, VarRuntime {
  _element: Element & ScVarProps;
}

export interface ScRunRuntime extends ScElementRuntimeBase, RunRuntime {
  _element: Element & ScRunProps;
}

export interface ScDisplayRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScDisplayProps;
}

export interface ScIfRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScIfProps;
  children: ScElementRuntime[];
}

export interface ScSelectRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScSelectProps;
  children: ScElementRuntime[];
}

export interface ScOptionRuntime extends ScElementRuntimeBase, UgenRuntime {
  _element: Element & ScOptionProps;
}

export interface ScRadioGroupRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScRadioGroupProps;
  children: ScElementRuntime[];
}

export interface ScRadioRuntime extends ScElementRuntimeBase, UgenRuntime {
  _element: Element & ScRadioProps;
}

export interface ScCheckboxRuntime extends ScElementRuntimeBase, InputRuntime {
  _element: Element & ScCheckboxProps;
}

// Attribute-less leaves.
export interface ScConsoleRuntime extends ScElementRuntimeBase, BaseRuntime {}

export interface ScScopeRuntime extends ScElementRuntimeBase, BaseRuntime {}

export interface ScStrudelRuntime extends ScElementRuntimeBase, BaseRuntime {}

export type ScElementRuntime =
  | ScPluginRuntime
  | ScGroupRuntime
  | ScSynthDefRuntime
  | ScUgenRuntime
  | ScControlRuntime
  | ScVarRuntime
  | ScSynthRuntime
  | ScRangeRuntime
  | ScCheckboxRuntime
  | ScRunRuntime
  | ScDisplayRuntime
  | ScIfRuntime
  | ScSelectRuntime
  | ScOptionRuntime
  | ScRadioGroupRuntime
  | ScRadioRuntime
  | ScConsoleRuntime
  | ScScopeRuntime
  | ScStrudelRuntime;

/** Items that parse their children (the rest are leaves). */
export type ScParentRuntime =
  | ScPluginRuntime
  | ScGroupRuntime
  | ScSynthDefRuntime
  | ScUgenRuntime
  | ScSynthRuntime
  | ScIfRuntime
  | ScSelectRuntime
  | ScRadioGroupRuntime;

export type NodeType = (typeof ELEMENTS)[keyof typeof ELEMENTS];
