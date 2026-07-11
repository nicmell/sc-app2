# XSD generation from per-component spec files

Status: **Phases 1–3.2 implemented and integration-reviewed** (branch
`xsd-codegen-draft`). The spec is the single
source for the XSD (build-time), attribute coercion (`getProp`), validation
(`validateProps`), the runtime-evaluated `bind:` attribute surface (Phase 3), and the
inputs' binding (Phase 3.2). See "State of the implementation — review notes" at the end
for the honest gates/quirks/improvements map.

## Final branch state — merge review (2026-07-10)

The branch now covers the complete maintained `src/` plugin surface. In addition to the
schema/runtime work described below, the integration pass established these conventions:

- Wrapper elements forward only attributes that are actually present (`ifDefined`), so an
  omitted plugin attribute preserves the ui-component's default instead of becoming an
  empty string.
- `sc-text`, `sc-flex`, `sc-row`, and `sc-col` are schema-backed visual elements. Display
  output uses `sc-text as="label"`, and the example plugins use the same typography and
  layout primitives as authored plugin markup.
- `sc-row`/`sc-col` use a native 24-track CSS Grid. The row owns spacing through `gap`; the
  slotted `sc-col` host is the grid item and adopts the shared column layout stylesheet in
  a Lit-managed shadow root. This is the WebKit/Tauri-compatible form; layout must not rely
  on styling a slotted element from inside `sc-base-row`'s shadow tree.
- `ScElement.createShadowRenderRoot()` is the standard wrapper shadow-root seam. It lets
  Lit adopt static component styles while preserving the parsed plugin children in light
  DOM for the runtime traversal.
- The examples were refreshed to exercise the new components without changing their audio
  or control behavior. The old top-level `sc-app/` tree is historical reference material;
  it is not part of this branch's maintained or generated surface.

## Phase 1 — the generated schema

The backend validates uploaded plugin entry XHTML against `sc-plugin-schema.xsd`
(`include_str!`-embedded, run through `fastxml`). Hand-maintained it drifted from the
components; it is now **generated from one pure-JSON spec per component**.

- **Specs**: each element ships a colocated `<tag>.spec.ts` exporting an `ElementSpec`
  (`internal/xsd/types.ts`): `tag`, `category` (feeds the per-category content groups in
  `internal/xsd/groups.ts`), `attrs` (`string | decimal | integer | boolean | scalar | enum`,
  `required`, `runtime` — the latter two see Phases 2–3), `content` (`choice` + `mixed`).
- **Generator**: `scripts/generate-xsd.ts` (`yarn generate:xsd`, tsx) discovers the specs,
  asserts the spec ↔ `ELEMENTS` bijection, and splices element decls / category groups /
  complex types into `internal/xsd/preamble.xml`'s `@generated:*` markers, writing the
  committed `src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd`.
- **Drift guard**: `__tests__/xsd-generate.test.ts` — committed schema === `generateXsd()`.
  Edit a spec → run `yarn generate:xsd` → `yarn test`. Never hand-edit the `.xsd`.

## Phase 2 — the spec as the single runtime source

The components' Lit `@property` declarations for declarative attributes were removed; the
components read the spec at runtime:

- **Registry**: `internal/xsd/registry.ts` collects the specs via eager `import.meta.glob`
  into `SPECS`; `ScElement.spec` looks the element up by tag.
- **`getProp(name)`**: reads `getAttribute(name)` coerced per the spec type
  (decimal/integer → Number, boolean → `!== "false"`, scalar → number-if-numeric-else-string,
  string/enum → string; absent → undefined so forwarded widget props fall back to the base
  widget's defaults). Untyped by design — call sites cast.
- **`validateProps()`**: spec-driven required/numeric/enum validation, run by `process()`
  before the per-element `validate()` (which keeps only semantic rules: name syntax, ranges,
  value-vs-derived exclusivity — the latter generalized in Phase 3).
- Only genuinely-reactive fields (a widget's `value`/`_checked`/…) stay as Lit properties.

## Phase 3 — runtime-evaluated props (the `bind:` namespace), string state, ternary, sc-button

Every spec attr — `runtime` defaults to TRUE, opt out with `runtime: false` — accepts a
`bind:`-namespaced sibling attribute holding a bind expression, evaluated live and reactive
on its sources — the generalization of the old ScState `bind` (which it replaces):

- **Surface syntax**: `bind:value="osc.freq * 2"`, `bind:min="vars.lo"`,
  `bind:icon="s1.gate ? 'stop' : 'play'"`. Entries declare the namespace ONCE on the root:
  `<html xmlns="…xhtml" xmlns:bind="urn:sc-app:bind">` — required, Chrome's text/xml parse
  is namespace-strict. (History: a bare `:value` sigil is impossible — not
  namespace-well-formed XML, not an XSD NCName; Phase 3 first shipped a `_` sigil, replaced
  by this real namespace.) The RUNTIME matches by QUALIFIED NAME —
  `getAttribute("bind:min")`, never `getAttributeNS` — the one attribute API portable
  across happy-dom (which doesn't namespace-resolve) and Chrome (which does but also serves
  qualified-name lookups); the canonical `bind` prefix is therefore enforced
  (foreign-prefix attributes are a parse error, or they'd silently no-op).
- **Spec/`generate-xsd`**: individual `bind:*` attributes can't be declared per-name in one
  schema document; instead every complexType with ≥1 runtime attr emits ONE
  `<xs:anyAttribute namespace="urn:sc-app:bind" processContents="skip"/>` (libxml2-verified:
  admits all `bind:*`, rejects other namespaces). fastxml 0.8.0 doesn't validate attributes
  AT ALL (its `validate_attributes` is a stub), so this is CI/documentation level — the
  runtime is the real gate. A `required` runtime attr emits `use="optional"` (satisfied by
  either form — XSD 1.0 can't express one-of; XSD 1.1 asserts later); `validateProps`
  enforces at parse: required-by-either-form, static-XOR-`bind:` mutual exclusion, no
  `bind:*` for unknown/opted-out attrs, and foreign-prefix rejection.
- **Engine (ScElement — ScDerived deleted)**: `process()` resolves every present `bind:attr`
  through `resolveStateBind` (bind-order constraint applies; error messages name the real
  attribute) into `runtimeProps[name] = { targets, expression }`. `load()`'s synchronous
  prefix wires the subscriptions (drop-first re-entrancy): initial recompute + recompute on
  each target's `statechange`, writing through `updateRuntimeValue(name, v)` — Object.is
  guard → `requestUpdate()` → `runtimeValueChanged` hook → for the `value` prop, the
  non-bubbling `statechange` dispatch. `getProp` returns the live evaluated value (coerced
  per spec type) when the `bind:` form is present, the static attribute otherwise.
- **State + graph inputs unified (`bind:value` replaces `bind` COMPLETELY)**: ScState
  extends ScElement directly; `_state` is the `value` runtime slot (store-fed for literal
  state, derived otherwise); derived state stays read-only (inert `setValue`, the input
  snap-back); ScControl's derived /n_set lives in the `runtimeValueChanged` hook. Inside an
  sc-ugen the SAME `bind:value` spelling is a graph-input REFERENCE (`bind:value="lfo"`,
  `"a, b"`, `"osc:1"`) consumed RAW by the synthdef collectors — `resolveRuntimeProps`
  skips ugen children; on a direct sc-synthdef child (a param) a `bind:` is a loud parse
  error (the param collector reads static values only — silence would drop the param from
  the def).
- **Strings + ternary**: state values widened to `number | string` (store slice included);
  the expression engine gained single-quoted string literals and the right-associative
  ternary (`cond ? a : b`, above the non-associative comparison layer); `==`/`!=` stay
  strict, `+` concatenates when either side is a string. The OSC boundary stays numeric:
  `sendControl`/`getControls` coerce `Number()` and SKIP (console.warn) on NaN — the UI
  keeps the string, scsynth never sees it. Numeric widgets coerce in `syncFromState` and
  ignore non-numeric state.
- **sc-button** (new element over ui-components' `sc-base-button`): `bind:value` required; a click
  commits `set` when given (fixed-value trigger) else toggles the bound state 0 ↔ 1;
  `label`/`icon`/`disabled` are runtime props (the ternary icon swap is the flagship demo).
- **Runtime opt-OUTS (`runtime: false`)**: every `name`; sc-synth's `synthdef` reference;
  slider/knob `value` (the widget-reactive prop is
  fed by the bind target); sc-ugen `type`/`rate`/`op`; nodes' `run`; sc-scope
  `bus`/`channels`/`frames` (the tap identity — no re-tap machinery); sc-strudel `orbit`;
  sc-option/sc-radio `value`/`label` (parse-time data); sc-col `span`/`offset`/`order`
  (static layout structure). Everything else is bindable by
  default, including sc-scope's display props (read per frame) and sc-button's `value`.
- **Accepted limitations** (documented, revisit in Phase 4): `validate()` range checks and
  enum membership apply to the STATIC form only — evaluated values are unvalidated and
  degrade gracefully. happy-dom's XML parser drops the later of two attributes whose LOCAL
  names collide (`value` + `bind:value`), so the mutual-exclusion conflict is
  unrepresentable in the unit examples gate — pinned instead by a direct `validateProps`
  test and the CDP harness (`bad-runtime-conflict` is harness-only).
- **Examples/fixtures**: all examples migrated (`bind:value`/`bind:when`/`bind:min`… +
  the `xmlns:bind` root declaration; synthdef-internal `bind="ref"` → `bind:value="ref"`);
  fixtures: `bad-param-bind` (param-position `bind:value`) new, `bad-derived-graph-input`
  deleted (its markup is now the legal graph-reference syntax), `bad-ugen-input`'s message
  now names value/bind:value.

## Closing cleanup

- `sc-synth` now names its required synth definition explicitly with the non-runtime
  `synthdef` attribute; the overloaded `bind` spelling was removed from this surface.
- The `sc-run` stub was removed completely. Examples use icon-only `sc-button` controls
  bound to writable `gate` controls, including group-level gates when one control should
  affect every synth in the group.
- UI wrappers no longer forward absent attributes as empty strings; this preserves the
  defaults and rendering contracts of `packages/ui-components`.
- The visual vocabulary now includes schema-backed `sc-text`, `sc-flex`, `sc-row`, and
  `sc-col`. The former stack/cluster split was replaced by the orientation-driven flex
  primitive.
- The row/column implementation is native CSS Grid rather than nested flex calculations.
  Static column selectors are shared by the base and plugin-facing elements, keeping the
  web and Tauri render paths identical.

## Phase 3.2 — inputs on `bind:value`, widget-state unification, evaluated-value warnings

The value inputs joined the same binding vocabulary, deleting their parallel machinery:

- **Inputs bind via `bind:value`** (`<sc-knob bind:value="s1.freq"/>`): the generic
  runtime-prop machinery carries the whole READ side; `ScInput` keeps only the WRITE half —
  `targetScState` derives from the resolved prop (a PLAIN single path → one writable state
  element; an EXPRESSION → no target, the input is a read-only live meter that snaps back;
  a static `value` → a fixed inert widget), `syncFromState` rides the `runtimeValueChanged`
  hook (no extra subscription), `commit()` = setValue + re-read snap-back (the explicit
  re-sync + forced update is load-bearing for the unchanged-value case — the Object.is
  guard means the hook won't fire). `resolveVisualBind` and ScInput's `_targetScNode` are
  gone. `value` is `required: true` on every value input
  (satisfied by either form).
- **Widget-state unification**: sc-slider/sc-knob's `@property({type:Number}) value` — the
  last attribute-linked reactive prop, whose Lit converter bypassed getProp/the spec and
  offered an uncontrolled public write path — became `@state() _value` like
  checkbox/switch/select/radio-group. The static `value` attribute now seeds through
  `getProp` in load() (accepted: a static-value widget shows the Lit default until its
  sequential load turn).
- **sc-button**: WRITE-ONLY, so `validateRuntimeProps()` (a new post-resolution hook on
  ScElement) requires a writable target — expression or static `value` fails at parse. Its
  click payload renamed `value` → `set` (the binding slot claimed `value`); `bind:set`
  gives a dynamic payload for free.
- **statechange gating**: `updateRuntimeValue` dispatches only for a STATE element's
  `value` (`isStateRuntime(this)`) — sound because only named state is targetable
  (`resolveControlBind` matches ScState children exclusively); inputs/visuals recompute
  silently.
- **Evaluated-value warnings** (`coerceProp`): once per element+prop (per INSTANCE — the
  AttrSpec objects are shared per tag), an evaluated non-numeric on a decimal/integer prop
  warns and returns undefined (Lit renders the fallback as an EMPTY attribute → the base
  widget's own default, never "NaN"); an evaluated enum miss warns and passes the string
  through. Covers the type/enum half of "re-validate evaluated values"; range checks remain
  static-only.

## Phase 4 — candidates

- **Child collection off `content.choice`** — single-source the runtime child filters
  (sc-select/sc-radio-group/sc-synthdef) from the spec's content model.
- **Honor `run="false"`** after node creation over the existing
  `OscClient.setNodeRun`/`ScNode.setRunning` seam.
- **Rust-side spec table for the upload gate** — generate an attribute-rules table from the
  same specs and enforce it in `manager.rs` (fastxml validates NO attributes); the
  pragmatic strictness win, no validator swap. See the review notes below.
- **Evaluated-value RANGE checks** — 3.2 covers type/enum; sc-scope-style range rules
  (gain > 0 etc.) still apply to the static form only.
- **XSD 1.1 validator swap** — an assert-capable validator to express mutual exclusion,
  required-one-of, wildcard constraints, and the ugen/param position rules at upload time.
- **sc-scope tap re-arm** — lift `bus`/`channels`/`frames` `runtime: false` by re-running
  the tap subscription on recompute.
- **Recompute batching** — one listener per (element, target) instead of per
  (prop, target): an element with N props on one source currently recomputes N times per
  change.
- **Shared attr-group spreads** — deduplicate the per-input attr blocks (`...INPUT_ATTRS`).
- **Generator `--check` in CI/pre-commit** — regenerate-and-diff instead of relying on the
  snapshot test alone.

## State of the implementation — review notes

An honest map of where the design stands after Phases 1–3.2: what each gate really
enforces, the quirks that persist, and the improvement paths considered.

### The three validation gates, by actual strength

| gate                                                                                        | what it REALLY enforces                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Upload** (fastxml 0.8.0, the only gate real plugins hit)                                  | well-formedness, element declarations, content models (leniently — laxer than libxml2), text content. **Attributes: NOTHING** — `validate_attributes` in fastxml is a stub, so every `use="required"`, enum, type, and the `anyAttribute` namespace boundary is decorative at upload. |
| **CI/dev** (xmllint/libxml2)                                                                | full XSD 1.0 — the only place the schema's attribute rules bite (required, enums, types, `bind:*` admitted / foreign namespaces rejected). Runs only when we run it.                                                                                                                  |
| **Runtime** (`validateProps` + `validate` + `resolveRuntimeProps` + `validateRuntimeProps`) | the authoritative gate: known/common attributes, required-by-either-form, XSD-compatible primitive types, static-XOR-`bind:`, name grammar, namespace prefixes, bind resolution + bind order, ugen/param position rules, writable-target rules.                                       |

Consequence: a wrong plugin usually uploads fine (201) and dies at parse with a pointed
error in the plugin box. Acceptable by design — but the upload gate advertises more than
it enforces, and the 400-vs-parse split is mostly historical accident.

### Two paths to a stricter upload gate

1. **XSD 1.1 swap.** `xs:assert` makes most runtime-structural rules expressible AND
   generatable from the specs: mutual exclusion (`not(@value and @bind:value)`),
   required-one-of (`@value or @bind:value` — restoring the required semantics we had to
   drop to `use="optional"`), constraining the `anyAttribute` wildcard to the spec'd names
   (`every $a in @bind:* satisfies local-name($a) = (…)`), and — because asserts see
   downward — the position rules as PARENT-side asserts (scUgenType: every sc-control
   child has `@value` or `@bind:value`; scSynthdefType: direct sc-control children carry
   no `bind:*`). A real validator would also enforce plain 1.0 `xs:pattern`, so the
   `scName` grammar could return to the schema. What stays runtime-only regardless: bind
   RESOLUTION (targets exist, order, the DAG), scope-level duplicate names through
   transparency, expression syntax, evaluated values. Risk: the Rust XSD 1.1 ecosystem is
   thin — this is a bet on a young validator or a heavier embed.
2. **Rust-side spec table (recommended first).** Generate a small attribute-rules table
   from the same `*.spec.ts` files and enforce it directly in `manager.rs` — everything in
   path 1 except the parent-side position asserts, with no validator swap, extending the
   spec-single-source principle to the backend.

### Quirks that persist (known, accepted, tracked)

- **`value` polysemy.** One word, several roles: literal state (store-backed), graph-input
  constant (ugen child), param default (synthdef child), the inputs' binding slot,
  display content. Phase 3.2 removed the worst two (the slider's attribute-linked reactive
  prop; the button payload → `set`); the synthdef sub-language keeps its own two meanings
  by design — it IS a different DSL sharing the syntax.
- **The namespace is half-real.** The runtime matches QUALIFIED names (`bind:` prefix,
  canonical, enforced) because happy-dom doesn't namespace-resolve; the URI only means
  something to libxml2. Contained by the foreign-prefix rejection — but if the test DOM
  ever changes, revisit `namespaceURI` matching. Related upstream bug worth reporting:
  happy-dom's XML parser DROPS the later of two attributes whose LOCAL names collide
  (`value` + `bind:value`), which is why the mutual-exclusion conflict is pinned by direct
  `validateProps` tests and the `bad-runtime-conflict` fixture is CDP-harness-only.
- **Evaluated values are partially validated.** 3.2's coerceProp warnings cover type +
  enum; `validate()`'s RANGE rules (sc-scope's gain > 0 etc.) still see the static form
  only — a `bind:gain` going non-positive degrades silently (Phase 4 item).
- **`required` + runtime = `use="optional"` in the XSD** — one-of is inexpressible in
  XSD 1.0; upload accepts, parse errors (path 1/2 above closes it).
- **Per-prop listener fan-out.** Each runtime prop subscribes to its targets separately —
  an element with three props bound to one var recomputes three times per change. Fine at
  this scale; batchable (Phase 4).
- **`getProp` is untyped by design** — the growing `as number` cast noise at call sites is
  the accepted price; typed helpers (numberProp/stringProp) would tidy it if it grows.
- **Static-value widgets flash their Lit default** until their sequential load turn seeds
  them (a consequence of removing the attribute-linked property — accepted).
- **Diamond dependencies** can transiently double-dispatch before converging (each hop is
  Object.is-guarded; settles in one pass by the DAG/bind-order construction) — accepted
  since the first state-layer step.

### What has proven itself

- **The spec as single source** has paid out four times: the generated XSD, runtime
  coercion/validation, the `bind:` runtime-prop surface, and the inputs' binding — each
  phase got cheaper because the previous one centralized the contract.
- **The bind-order/DAG constraint** keeps financing features: runtime props and the input
  unification inherited one-pass settling and cycle-freedom with zero new logic.
- **Transparency + `namedScParent`** survived four refactors untouched.
- **The two-gate testing discipline** (pinned exact messages in happy-dom + the CDP
  harness in real Chrome) caught every environment divergence this work hit — the
  namespace strictness, the localName dedup, the stale-registry cases.

## Final review follow-ups

The integration review found three lifecycle/contract edges that should be resolved or
explicitly accepted before merging:

1. **Partial plugin-load rollback.** `ScPlugin.boot()` and `reload()` surface a rejected
   child load in the plugin error box, but do not currently call `unload()`. If the plugin
   group or earlier children were already created, they remain live until disconnect or
   unmount. The catch path should roll back the partial load before retaining the error.
2. **Synthdef acknowledgement race.** If a `/d_recv` acknowledgement arrives after the
   plugin load epoch was invalidated, `ScSynthDef.load()` correctly refuses to mark itself
   loaded, but the installed global definition is then outside `unload()`'s `loaded` guard.
   The stale completion path should send `/d_free`, with a focused regression test.
3. **Grid integer contract.** `sc-col`'s static stylesheet has selectors only for canonical
   `span` 0–24, `offset` 1–23, and `order` -24–24 values, while the current spec accepts any
   `xs:integer` lexical form. Out-of-range or non-canonical values (for example `span="99"`
   or `span="+12"`) validate but silently miss the intended selector. Add spec-supported
   integer bounds/canonicalization, or an element-level validator that rejects values the
   stylesheet cannot represent.
