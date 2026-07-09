# XSD generation from per-component spec files

Status: **implemented** (branch `xsd-codegen-draft`). This documents what shipped and the
open problems + possible solutions; it is no longer a forward-looking plan.

## Why

The backend validates uploaded plugin entry XHTML against `sc-plugin-schema.xsd`
(`include_str!`-embedded in `core/plugin/manager.rs`, run through `fastxml`). Hand-maintained,
it drifted from the components — adding `sc-knob`/`sc-switch` meant editing the element decl,
the content-model groups, and the complex type by hand, and a miss silently rejected or
wrongly accepted markup. The schema is now **generated from one pure-JSON spec per
component**, and two tests keep it from drifting.

## As built

- **Spec per element** — colocated `src/sc-elements/**/<tag>.spec.ts`, `export const spec:
  ElementSpec`. Contract in `src/sc-elements/internal/xsd/types.ts`:
  - `attrs`: a `type`-discriminated union (`string`/`decimal`/`integer`/`boolean`/`enum`),
    `required?` common;
  - `content`: flat `{ choice?, mixed? }` in XSD vocabulary (omit ⇒ empty); `choice` refs are
    element tags or group names, resolved by the generator;
  - `category`: drives content-group membership.
- **Groups** — `src/sc-elements/internal/xsd/groups.ts` (`BLOCK_GROUPS`): one `<xs:group>`
  per category (`scInputs`/`scVisuals`/`scWidgets`/`scState`/`scNodes`/`scSynthDefs`);
  `blockContent` = `htmlElements` + those. `option`/`ugen` are child-only (no group; reached
  via a parent's `content.choice`).
- **Preamble** — `src/sc-elements/internal/xsd/preamble.xml`: the fixed, hand-authored half
  (HTML scaffolding, `htmlElements`/`inlineContent`, root, `blockType`/`inlineType`/
  `listType`) with `@generated:{elements,groups,complexTypes}` markers and a "do not edit"
  banner.
- **Generator** — `scripts/generate-xsd.ts` (`yarn generate:xsd`, via `tsx`): discovers specs
  (fs walk + dynamic import), asserts the spec↔`ELEMENTS` bijection, emits element decls +
  per-category groups + `blockContent` + one complex type per spec (exhaustive `switch` on
  `attr.type`; `enum` → inline `<xs:restriction>`; `required` → `use="required"`), splices
  into the preamble, and writes `src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd`. Output
  is deterministic (ELEMENTS order).
- **Drift guards** (vitest, in `yarn test`):
  - `__tests__/xsd-generate.test.ts` — committed schema === `generateXsd()`.
  - `__tests__/xsd-reconcile.test.ts` — each spec's attribute names + coarse types match the
    component's `elementProperties` (by attribute name, so `sc-ugen`'s `type` ↔ `ugen`;
    `state`/converter props handled), and specs ↔ `ELEMENTS` is a bijection.

Verified: deterministic regen, `xmllint` accepts every example, `cargo test` loads the schema,
`yarn test`/`build`/`lint` green.

## Changing the schema

Edit a `<tag>.spec.ts`, run `yarn generate:xsd`, run `yarn test`. Never hand-edit the `.xsd`
or the generated regions — the snapshot test will fail. Adding an element: create its
`.spec.ts` (the reconciliation test enforces one per `ELEMENTS` tag).

## Open problems & possible solutions

1. **Two sources, not one.** A spec restates the attribute names/types that also live as
   `@property` on the component. The reconciliation test guards it, but the coupling is
   *relocated into a test* (which imports the classes under happy-dom), not removed.
   → Accepted; the test is the safety net. Fuller single-sourcing is problems 2–3.
2. **The cross-check is partial.** Reconciliation verifies attribute *names* + *coarse* type
   (`number`/`boolean`/`string`) only. `required`, `enum` values, and content models have no
   component counterpart, so a wrong `required` flag or enum list can't be caught by any test.
   → *Possible:* Phase 2 — a base `validate()` reads `spec.required` (single-sources required);
   for enums, a narrow `ts-morph` pass could read the component's TS union type instead of a
   hand-listed `enum`, or accept trust-the-spec (a handful of props).
3. **The generated schema is stricter than the runtime on some attributes.** It enforces
   `size`/`orientation` enums and `required` binds at *upload*, but the runtime `validate()`
   only enforces some of those (e.g. it doesn't range-check `size` on a slider). So a plugin
   can pass one gate and fail the other on those attrs.
   → *Possible:* single-source `required`/enums into `validate()` (Phase 2/3) so the two gates
   agree; or deliberately keep the schema as the stricter upload gate and document it.
4. **`fastxml` doesn't enforce everything the schema now expresses.** libxml2 is lenient on
   content models (it accepts `bad-run-bind`, which a spec-correct validator rejects); it also
   ignores `xs:pattern` (moot now — `scName` was dropped, name syntax stays in JS
   `requireName`). So the richer generated facets are partly *documentation* under the current
   validator.
   → *Possible:* swap to a strict Rust validator (`uppsala`, pure-Rust zero-dep; or
   `semyonc/xsd-schema`, XSD 1.1 + assertions) — a separate track evaluated earlier in the
   conversation; only `xsd-schema` additionally unlocks XSD 1.1 `xs:assert` (e.g. value-XOR-bind).
5. **Inheritance is flattened by hand.** Each input spec re-lists `bind`/`size`/`disabled`
   inherited from `ScInput`/the category bases.
   → *Possible:* shared attr-group spreads (`...INPUT_ATTRS`); the reconciliation test catches
   any mismatch meanwhile.
6. **The generator must be run after editing a spec.** Nothing runs it automatically; the
   snapshot test only *detects* staleness (it fails).
   → *Possible:* a pre-commit hook or a CI step running `yarn generate:xsd --check`.
7. **`.spec.ts` reads as "test file"** in most ecosystems. No collision here (the runner glob
   is `*.test.ts`), but it's mildly ambiguous.
   → *Possible:* rename to `<tag>.xsd.ts` / `.schema.ts` (cosmetic).
8. **Content model is limited to a repeatable `choice` + `mixed`.** No `sequence`/`all` or
   per-item `minOccurs`/`maxOccurs` — none of the generated elements needs them (ordered
   `head`/`html` content lives in the preamble).
   → *Possible:* add optional keys to `Content` if an element ever needs ordered/bounded content.

## Follow-ups (not done — Phase 1 only shipped)

- **Phase 2** — single-source `required` (problem 2/3) into the runtime `validate()` from the
  specs; touches each `validate()` and the pinned error-message tests.
- **Phase 3** — single-source the runtime child-collection (`sc-select`/`sc-synthdef` filters)
  off `content.choice`.
- **Validator swap** — evaluate replacing `fastxml` (problem 4); separate from this work.
