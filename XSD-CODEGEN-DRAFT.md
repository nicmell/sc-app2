# XSD generation from per-component spec files

Status: **Phases 1–3 implemented** (branch `xsd-codegen-draft`). The spec is the single
source for the XSD (build-time), attribute coercion (`getProp`), validation (`validateProps`),
and — since Phase 3 — the runtime-evaluated `bind:` attribute surface.

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
  `bind:*` for unknown/opted-out attrs, foreign-prefix rejection, and a pointed migration
  error for the retired `_` sigil.
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
  the def). A literal `bind` attribute on control/var gets a pointed migration error.
- **Strings + ternary**: state values widened to `number | string` (store slice included);
  the expression engine gained single-quoted string literals and the right-associative
  ternary (`cond ? a : b`, above the non-associative comparison layer); `==`/`!=` stay
  strict, `+` concatenates when either side is a string. The OSC boundary stays numeric:
  `sendControl`/`getControls` coerce `Number()` and SKIP (console.warn) on NaN — the UI
  keeps the string, scsynth never sees it. Numeric widgets coerce in `syncFromState` and
  ignore non-numeric state.
- **sc-button** (new element over ui-components' `sc-base-button`): `bind` required; a click
  commits `value` when given (fixed-value trigger) else toggles the bound state 0 ↔ 1;
  `label`/`icon`/`disabled` are runtime props (the ternary icon swap is the flagship demo).
- **Runtime opt-OUTS (`runtime: false`)**: every `name`; `bind` on inputs/sc-synth/sc-run
  (target references, not expressions); slider/knob `value` (the widget-reactive prop is
  fed by the bind target); sc-ugen `type`/`rate`/`op`; nodes' `run` (sc-run step); sc-scope
  `bus`/`channels`/`frames` (the tap identity — no re-tap machinery); sc-strudel `orbit`;
  sc-option/sc-radio `value`/`label` (parse-time data). Everything else is bindable by
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

## Phase 4 — candidates

- **Child collection off `content.choice`** — single-source the runtime child filters
  (sc-select/sc-radio-group/sc-synthdef) from the spec's content model.
- **`bind:run` + sc-run** — honor `run="false"` at load and lift `run`'s `runtime: false`
  over the existing `OscClient.setNodeRun`/`ScNode.setRunning` seam; implement the sc-run
  element.
- **Re-validate evaluated values** — apply range/enum checks to runtime-prop recomputes
  (today static-form-only; a `bind:gain` ≤ 0 or a bad enum string degrades silently).
- **XSD 1.1 validator swap** — replace fastxml with an assert-capable validator to express
  the static/`bind:` mutual exclusion (and value-XOR-`bind:value`) at upload time — and to
  actually validate attributes at all.
- **sc-scope tap re-arm** — lift `bus`/`channels`/`frames` `runtime: false` by re-running
  the tap subscription on recompute.
- **Shared attr-group spreads** — deduplicate the per-input attr blocks (`...INPUT_ATTRS`).
- **Generator `--check` in CI/pre-commit** — regenerate-and-diff instead of relying on the
  snapshot test alone.
