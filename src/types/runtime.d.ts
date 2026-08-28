import type { Expr } from "@/lib/expression";
import type { Store } from "@/lib/utils/reactiveStore";
import type { ScElement } from "@/sc-elements/internal/sc-element";
import type { ScParent } from "@/sc-elements/internal/sc-parent";
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

// The runtime values live as plain fields declared on the element classes
// (ScElement: `_rootScNode`/`_parentScNode`/`basePath`; the bases add their
// category fields — ScNode: nodeId/loaded, ScSynthDef: params/specs),
// assigned by `process()` and the per-element `resolveRuntime` hooks. Values
// that would duplicate a reactive property are unified with it instead:
// there is no runtime `name` or `run` (read the props), and a state
// element's resolved value lives in its `value` prop.

/** The plugin root's per-instance runtime store: this instance's literal
 *  state map (path → value), reached by descendants via `_rootScNode`. Lives
 *  and dies with the element — a remount reseeds. */
export interface PluginRuntime {
  runtime: Store<PluginRuntimeValues>;
}

/** One persisted literal-state value, keyed (in `BoxPresets.values`) by the
 *  element's content-hash id; `path` is debug metadata only — the id is the
 *  match key (see contentHash.ts for the id scheme). */
export interface PresetEntry {
  path: string;
  value: StateValue;
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

/** The per-LEVEL parse state threaded through the engine's `process(ctx)`
 *  recursion (sc-elements/internal/engine) — all siblings share one
 *  context. `nodes` is the per-parse set of processed elements (the
 *  idempotence/forward-ref guard), `scope` the cumulative bind-resolution
 *  scope. Store-key
 *  uniqueness needs no global map: live state must be declared on a node
 *  (vars validate it; a control off a node is synthdef-plane data that
 *  never loads), and sc-if rejects node descendants — so path-transparent
 *  containers can never smuggle in a colliding key. */
export interface RuntimeContext {
  rootNode: ScParent;
  nodes: Set<ScElement>;
  /** The level's flattened sibling walk — the CURSOR's domain: the engine's
   *  driver sets `index` and processes `siblings[index]`. */
  siblings: ScElement[];
  /** The driver-set cursor into `siblings` — also the position the
   *  seeded path hash id is minted from. */
  index: number;
  /** The cumulative name-lookup chain (the level's siblings prefixed onto
   *  the enclosing scopes) — lookup only, unrelated to the cursor. */
  scope: ScElement[];
  parentNode?: ScParent;
  path: string[];
  /** Resumed literal-state values (element id → value), claimed and
   *  CONSUMED by `ScState.resolveRuntime` — a claimed entry is deleted, so
   *  a re-resolution can never re-apply a stale value over a user edit.
   *  Whatever survives the parse is an orphan (a value nothing claims) and
   *  is dropped by `ScPlugin.processRoot`. */
  resumed?: Record<string, StateValue>;
}
