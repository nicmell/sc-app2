import type { Expr } from "@/lib/expression";
import type { UgenSpec } from "@/lib/synthdef/compileSynthDef";
import type { Store } from "@/lib/utils/reactiveStore";
import type { ScElement, ScParentElement } from "@/sc-elements/internal/sc-element";
import type { ScState } from "@/sc-elements/internal/sc-state";

// The engine's type system. There are NO item structures and NO parallel
// attribute interfaces: the element IS the runtime — `process()` resolves the
// runtime values and assigns them onto the component, where they're declared
// as plain fields (ScElement base + the internal/ category bases) next to the
// HTML attributes' decorated reactive properties (the component class IS the
// attribute contract). Outside-the-DOM access goes through the mounted
// plugin root's `_scChildren` tree and `walkPath` name paths.

// ── Bind expressions (lib/expression) ─────────────────────────────────────

/** What a runtime value can hold: numbers everywhere, strings for the
 *  presentation layer (string vars, ternary labels/icons), and numeric
 *  ARRAYS (a `value` comma-list — control-array params, envelope buffers).
 *  Arrays are IMMUTABLE by convention — a fresh array per edit (the
 *  Object.is guards never see in-place mutation). Expressions evaluate over
 *  arrays with SC's multichannel expansion; the OSC boundary sends /n_setn
 *  for arrays and /n_set for scalars (NaN skipped either way). */
export type StateValue = string | number | number[];

/** One mounted plugin's LITERAL runtime values, keyed by the state element's
 *  full named path (e.g. `"s1.freq"`; a plugin-level control is just
 *  `"freq"`). Only literal, user-writable state is store-backed — derived
 *  (`bind:value`) values live on the elements as `_state` and propagate via
 *  "statechange". Seeded from the declarative defaults in the load pass;
 *  written through `ScState.setValue` (for controls the write path that also
 *  dispatches `/n_set`, or `/n_setn` for arrays). */
export type PluginRuntimeValues = Record<string, StateValue>;

/** The bind-expression AST — defined by the language module. */
export type { Expr } from "@/lib/expression";

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
  /** The parsed parent — the nearest NON-TRANSPARENT sc ancestor (unset at
   *  the root). Owned by `processParent`, not `baseRuntime`: resolution must
   *  not overwrite it with the level owner. */
  _parentScNode?: ScParentElement;
  path: string[];
}

export interface NodeRuntime extends BaseRuntime {
  loaded: boolean;
  nodeId: number;
}

/** The plugin root's per-instance runtime store: this instance's literal
 *  state map (path → value), reached by descendants via `_rootScNode`. Lives
 *  and dies with the element — a remount reseeds. */
export interface PluginRuntime {
  runtime: Store<PluginRuntimeValues>;
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
  /** The param defaults (scalars or control-array comma-lists) + DOM-ordered
   *  ugen specs (collected at parse) — compiled to SCgf right at /d_recv
   *  time in the load pass. */
  params: Record<string, number | number[]>;
  specs: UgenSpec[];
}

/** The per-LEVEL parse state threaded through the elements' `process(ctx)`
 *  recursion (sc-elements/internal ScElement) — all siblings share one
 *  context. `nodes` is the per-parse set of processed elements (the
 *  idempotence/forward-ref guard), `scope` the cumulative bind-resolution
 *  scope. Store-key
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
  /** The level's mutable document-order counter — each `process` mints its
   *  path-chained hash id from it. 0 at the entry call and per child level. */
  index: number;
}
