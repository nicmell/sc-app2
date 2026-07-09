# XSD generation from per-component spec files

Status: **Phases 1–3 implemented** (branch `xsd-codegen-draft`). The spec is the single
source for the XSD (build-time), attribute coercion (`getProp`), validation (`validateProps`),
and — since Phase 3 — the runtime-evaluated `_attr` surface.

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

## Phase 3 — runtime-evaluated props (`_attr`), string state, ternary, sc-button

Any spec attr flagged `runtime: true` accepts a `_`-prefixed sibling attribute holding a
bind expression, evaluated live and reactive on its sources — the generalization of the old
ScState `bind` (which it replaces):

- **Surface syntax**: `_value="osc.freq * 2"`, `_min="vars.lo"`,
  `_icon="s1.gate ? 'stop' : 'play'"`. The originally-planned `:value` is impossible in this
  stack: entries parse as text/xml (a leading-colon attribute is not namespace-well-formed —
  `Failed to parse QName`) and XSD attribute names must be NCNames, so the schema could never
  declare it. `_` is the NCName-legal sigil.
- **Spec/`generate-xsd`**: `runtime: true` additionally emits
  `<xs:attribute name="_<name>" type="xs:string"/>`; a `required` runtime attr emits BOTH
  forms optional (XSD 1.0 cannot express one-of — deferred to XSD 1.1 asserts) while
  `validateProps` enforces at parse: required satisfied by either form, the two forms
  mutually exclusive, and no stray `_attrs` (scanned against the element's real attributes).
- **Engine (ScElement — ScDerived deleted)**: `process()` resolves every present `_attr`
  through `resolveStateBind` (bind-order constraint applies; error messages name the real
  attribute) into `runtimeProps[name] = { targets, expression }`; a `_attr` on a DISABLED
  element (synthdef graph input) fails loudly. `load()`'s synchronous prefix wires the
  subscriptions (drop-first re-entrancy): initial recompute + recompute on each target's
  `statechange`, writing through `updateRuntimeValue(name, v)` — Object.is guard →
  `requestUpdate()` → `runtimeValueChanged` hook → for the `value` prop, the non-bubbling
  `statechange` dispatch. `getProp` returns the live evaluated value (coerced per spec type)
  when the `_attr` is present, the static attribute otherwise.
- **State (`_value` replaces `bind`)**: ScState extends ScElement directly; `_state` is the
  `value` runtime slot (store-fed for literal state, derived otherwise); derived state stays
  read-only (inert `setValue`, the input snap-back). **`bind` duality resolved**: on
  sc-control, `bind` remains ONLY the synthdef graph-input reference (inside
  sc-synthdef/sc-ugen); an enabled node control with `bind` is a parse error, and sc-var
  rejects `bind` outright. ScControl's derived /n_set moved to the `runtimeValueChanged` hook.
- **Strings + ternary**: state values widened to `number | string` (store slice included);
  the expression engine gained single-quoted string literals and the right-associative
  ternary (`cond ? a : b`, above the non-associative comparison layer); `==`/`!=` stay
  strict, `+` concatenates when either side is a string. The OSC boundary stays numeric:
  `sendControl`/`getControls` coerce `Number()` and SKIP (console.warn) on NaN — the UI keeps
  the string, scsynth never sees it. Numeric widgets coerce in `syncFromState` and ignore
  non-numeric state.
- **sc-button** (new element over ui-components' `sc-base-button`): `bind` required; a click
  commits `value` when given (fixed-value trigger) else toggles the bound state 0 ↔ 1;
  `label`/`icon`/`disabled` are runtime props (the ternary icon swap is the flagship demo).
- **Runtime-flagged attrs**: slider/knob `min`/`max`/`step`/`label`/`disabled`;
  checkbox/switch/select/radio-group `label`/`placeholder`/`disabled`; control/var `value`
  (var's is `scalar` — string-capable); display `value` (required) + `format`; sc-if `when`
  (required, `scalar` so an evaluated 0 stays falsy — replaces its `bind`); button
  `label`/`icon`/`disabled`.
- **Examples/fixtures**: all examples migrated (`_value`/`_when`); new
  `bindings/dynamic-props-plugin` + `inputs/button-plugin`; new fixtures
  `bad-runtime-conflict` (both forms) and `bad-derived-graph-input` (`_value` inside a
  synthdef), pinned in examples.test.ts / validate-examples.mjs / examples/README.md.

## Phase 4 — candidates

- **Child collection off `content.choice`** — single-source the runtime child filters
  (sc-select/sc-radio-group/sc-synthdef) from the spec's content model.
- **`_run` + sc-run** — honor `run="false"` at load and make `run` a runtime prop over the
  existing `OscClient.setNodeRun`/`ScNode.setRunning` seam; implement the sc-run element.
- **XSD 1.1 validator swap** — replace fastxml with an assert-capable validator to express
  the static/`_` mutual exclusion (and value-XOR-`_value`) at upload time.
- **sc-scope display props as runtime props** — `level`/`gain`/`trigger` bindable (the
  renderer reads per frame; needs only the spec flags once verified).
- **Shared attr-group spreads** — deduplicate the per-input attr blocks (`...INPUT_ATTRS`).
- **Generator `--check` in CI/pre-commit** — regenerate-and-diff instead of relying on the
  snapshot test alone.
