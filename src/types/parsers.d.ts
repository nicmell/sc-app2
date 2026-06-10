import type { ELEMENTS } from "@/constants/sc-elements";

// The plugin element-tree type system. Items carry only what the parser and
// runtime processor infer — identity (`id`), structure (`children`),
// the processor-attached `runtime`, and `_element`: the mounted web component
// itself. The HTML attributes live as reactive properties ON the component
// (typed here as the per-element `Props` interfaces the components implement),
// so nothing is duplicated into the items: read them through `_element`.

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
  /** Bind path → the target state item's id (plain paths only for now — the
   *  arithmetic bind-expression parser returns with the sc-var migration). */
  targets?: Record<string, string>;
}

export interface UgenRuntime extends BaseRuntime {}

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
  | ScSynthDefItem
  | ScUgenItem
  | ScControlItem
  | ScSynthItem
  | ScRangeItem
  | ScConsoleItem
  | ScScopeItem
  | ScStrudelItem;

/** Items that parse their children (the rest are leaves). */
export type ScParentItem = ScPluginItem | ScSynthDefItem | ScUgenItem | ScSynthItem;

export type NodeType = (typeof ELEMENTS)[keyof typeof ELEMENTS];

/** An item before the runtime processor has attached its `runtime` (and,
 *  recursively, its children's) — what the HTML hydration step produces. */
export type StripRuntime<T> = Omit<T, "runtime" | "children"> & {
  children?: ScElementItemBase[];
};
