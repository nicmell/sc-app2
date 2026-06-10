import type { ELEMENTS } from "@/constants/sc-elements";

// The plugin element-tree type system. Items carry only what the parser and
// runtime processor infer — identity (`id`), structure (`children`),
// the processor-attached `runtime`, and `_element`: the mounted web component
// itself. The HTML attributes live as reactive properties ON the component
// (typed here as the per-element `Props` interfaces the components implement),
// so nothing is duplicated into the items: read them through `_element`.

// ── Bind expressions (lib/utils/expression) ──────────────────────────────

export type Expr =
  | { type: "number"; value: number }
  | { type: "var"; name: string }
  | { type: "unary"; op: "-"; expr: Expr }
  | { type: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr };

// ── Runtime types ─────────────────────────────────────────────────────────

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

// ── Items ─────────────────────────────────────────────────────────────────
//
// There is no `type` field: the discriminant IS the element's tag —
// `typeOf(item)` (lib/utils/guards) derives it from `_element.tagName`.

export interface ScElementItemBase {
  id: string;
  /** The mounted web component this item was hydrated from — its reactive
   *  properties ARE the element's HTML attributes. */
  _element: Element;
}

export interface ScPluginItem extends ScElementItemBase {
  _element: Element & ScPluginProps;
  children: ScElementItem[];
  runtime: NodeRuntime;
}

export interface ScSynthDefItem extends ScElementItemBase {
  _element: Element & ScSynthDefProps;
  children: ScElementItem[];
  runtime: SynthDefRuntime;
}

export interface ScUgenItem extends ScElementItemBase {
  _element: Element & ScUgenProps;
  children: ScElementItem[];
  runtime: UgenRuntime;
}

export interface ScControlItem extends ScElementItemBase {
  _element: Element & ScControlProps;
  runtime: ControlRuntime;
}

export interface ScSynthItem extends ScElementItemBase {
  _element: Element & ScSynthProps;
  children: ScElementItem[];
  runtime: NodeRuntime;
}

export interface ScRangeItem extends ScElementItemBase {
  _element: Element & ScRangeProps;
  runtime: InputRuntime;
}

export interface ScGroupItem extends ScElementItemBase {
  _element: Element & ScGroupProps;
  children: ScElementItem[];
  runtime: NodeRuntime;
}

export interface ScVarItem extends ScElementItemBase {
  _element: Element & ScVarProps;
  runtime: VarRuntime;
}

export interface ScRunItem extends ScElementItemBase {
  _element: Element & ScRunProps;
  runtime: RunRuntime;
}

export interface ScDisplayItem extends ScElementItemBase {
  _element: Element & ScDisplayProps;
  runtime: InputRuntime;
}

export interface ScIfItem extends ScElementItemBase {
  _element: Element & ScIfProps;
  children: ScElementItem[];
  runtime: InputRuntime;
}

export interface ScSelectItem extends ScElementItemBase {
  _element: Element & ScSelectProps;
  children: ScElementItem[];
  runtime: InputRuntime;
}

export interface ScOptionItem extends ScElementItemBase {
  _element: Element & ScOptionProps;
  runtime: UgenRuntime;
}

export interface ScRadioGroupItem extends ScElementItemBase {
  _element: Element & ScRadioGroupProps;
  children: ScElementItem[];
  runtime: InputRuntime;
}

export interface ScRadioItem extends ScElementItemBase {
  _element: Element & ScRadioProps;
  runtime: UgenRuntime;
}

export interface ScCheckboxItem extends ScElementItemBase {
  _element: Element & ScCheckboxProps;
  runtime: InputRuntime;
}

// Attribute-less leaves.
export interface ScConsoleItem extends ScElementItemBase {
  runtime: BaseRuntime;
}

export interface ScScopeItem extends ScElementItemBase {
  runtime: BaseRuntime;
}

export interface ScStrudelItem extends ScElementItemBase {
  runtime: BaseRuntime;
}

export type ScElementItem =
  | ScPluginItem
  | ScGroupItem
  | ScSynthDefItem
  | ScUgenItem
  | ScControlItem
  | ScVarItem
  | ScSynthItem
  | ScRangeItem
  | ScCheckboxItem
  | ScRunItem
  | ScDisplayItem
  | ScIfItem
  | ScSelectItem
  | ScOptionItem
  | ScRadioGroupItem
  | ScRadioItem
  | ScConsoleItem
  | ScScopeItem
  | ScStrudelItem;

/** Items that parse their children (the rest are leaves). */
export type ScParentItem =
  | ScPluginItem
  | ScGroupItem
  | ScSynthDefItem
  | ScUgenItem
  | ScSynthItem
  | ScIfItem
  | ScSelectItem
  | ScRadioGroupItem;

export type NodeType = (typeof ELEMENTS)[keyof typeof ELEMENTS];

/** An item before the runtime processor has attached its `runtime` (and,
 *  recursively, its children's) — what the HTML hydration step produces. */
export type StripRuntime<T> = Omit<T, "runtime" | "children"> & {
  children?: ScElementItemBase[];
};
