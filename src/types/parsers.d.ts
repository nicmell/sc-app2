// The plugin element-tree type system (ported from the old sc-app, trimmed to
// the migrated elements). `processHtml` (lib/html) hydrates plugin HTML into
// these items and the runtime processor (src/runtime/handlers) attaches their
// `runtime`; sc-plugin registers the processed tree in the global runtime map
// (src/runtime/registry).

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

// ── Items ─────────────────────────────────────────────────────────────────

export interface ScElementItemBase {
  id: string;
  type: NodeType;
  /** The live DOM element this item was hydrated from. */
  _element?: Element;
}

export interface ScPluginItem extends ScElementItemBase {
  type: "sc-plugin";
  run: boolean;
  children: ScElementItem[];
  runtime: NodeRuntime;
}

export interface ScSynthDefItem extends ScElementItemBase {
  type: "sc-synthdef";
  name: string;
  children: ScElementItem[];
  runtime: SynthDefRuntime;
}

export interface ScUgenItem extends ScElementItemBase {
  type: "sc-ugen";
  name: string;
  /** The SuperCollider UGen class (the element's `type` attribute). */
  ugen: string;
  rate: string;
  /** Operator for BinaryOpUGen / UnaryOpUGen. */
  op?: string;
  children: ScElementItem[];
  runtime: UgenRuntime;
}

export interface ScControlItem extends ScElementItemBase {
  type: "sc-control";
  name: string;
  /** Literal value — absent when `bind` is set. */
  value?: number;
  /** Reference to another control by name — absent when `value` is set. */
  bind?: string;
  runtime: ControlRuntime;
}

export interface ScSynthItem extends ScElementItemBase {
  type: "sc-synth";
  name: string;
  /** The sc-synthdef this synth instantiates. */
  bind: string;
  run: boolean;
  children: ScElementItem[];
  runtime: NodeRuntime;
}

export interface ScRangeItem extends ScElementItemBase {
  type: "sc-range";
  bind: string;
  runtime: InputRuntime;
}

// Attribute-less leaves (their per-element validation lives in lib/html
// handlers, ready for future attributes).
export interface ScConsoleItem extends ScElementItemBase {
  type: "sc-console";
  runtime: BaseRuntime;
}

export interface ScScopeItem extends ScElementItemBase {
  type: "sc-scope";
  runtime: BaseRuntime;
}

export interface ScStrudelItem extends ScElementItemBase {
  type: "sc-strudel";
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

export type NodeType = ScElementItem["type"];

/** An item before the runtime processor has attached its `runtime` (and,
 *  recursively, its children's) — what the HTML hydration step produces. */
export type StripRuntime<T> = Omit<T, "runtime" | "children"> & {
  children?: ScElementItemBase[];
};
