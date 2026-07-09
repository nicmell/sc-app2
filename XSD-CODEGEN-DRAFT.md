# XSD generation from per-component spec files

Status: **Phase 1 implemented** (branch `xsd-codegen-draft`). Phase 2 (make the spec the
single runtime source — `getProp` + `validateProps`) is designed below, not yet built.

## Why

The backend validates uploaded plugin entry XHTML against `sc-plugin-schema.xsd`
(`include_str!`-embedded in `core/plugin/manager.rs`, run through `fastxml`). Hand-maintained,
it drifted from the components — adding `sc-knob`/`sc-switch` meant editing the element decl,
the content-model groups, and the complex type by hand, and a miss silently rejected or
wrongly accepted markup. The schema is now **generated from one pure-JSON spec per
component**, and tests keep it from drifting.

## As built (Phase 1)

### File layout

```
src/sc-elements/
  inputs/sc-slider/sc-slider.ts        ← the Lit component
  inputs/sc-slider/sc-slider.spec.ts   ← its XSD spec (colocated), one per element
  …
  internal/xsd/
    types.ts        ElementSpec / AttrSpec / Content
    groups.ts       BLOCK_GROUPS (category → content-group), GROUP_NAMES
    preamble.xml    fixed HTML scaffolding + @generated markers
scripts/generate-xsd.ts                the generator (yarn generate:xsd)
src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd   the committed, generated output
```

### The spec type (`internal/xsd/types.ts`)

```ts
export type Category =
  | "input" | "visual" | "widget" | "state" | "node" | "synthdef"
  | "ugen" | "option";                        // ugen/option are child-only

interface AttrCommon { required?: boolean }   // → use="required" | "optional"
export type AttrSpec =
  | (AttrCommon & { type: "string" })                            // xs:string
  | (AttrCommon & { type: "decimal" })                           // xs:decimal
  | (AttrCommon & { type: "integer" })                           // xs:integer
  | (AttrCommon & { type: "boolean" })                           // xs:boolean
  | (AttrCommon & { type: "enum"; values: readonly string[] });  // inline restriction

export interface Content {                    // omit ⇒ empty complexType
  choice?: string[];                          // element tags and/or group names
  mixed?: boolean;                            // → complexType mixed="true"
}

export interface ElementSpec {
  tag: string;                                // must be an ELEMENTS value
  category: Category;
  attrs?: Record<string, AttrSpec>;
  content?: Content;
}
```

Representative specs (the full set is the 20 `<tag>.spec.ts` files):

```ts
// empty leaf, all optional              inputs/sc-slider/sc-slider.spec.ts
{ tag: "sc-slider", category: "input", attrs: { bind: {type:"string"},
  min:{type:"decimal"}, max:{type:"decimal"}, step:{type:"decimal"}, value:{type:"decimal"},
  label:{type:"string"}, size:{type:"enum",values:["sm","md","lg"]},
  orientation:{type:"enum",values:["horizontal","vertical"]}, disabled:{type:"boolean"} } }
// required attr + child choice          synthdef/sc-synthdef/sc-synthdef.spec.ts
{ tag:"sc-synthdef", category:"synthdef", attrs:{ name:{type:"string",required:true} },
  content:{ choice:["sc-control","sc-ugen"] } }
// group choice + mixed                  visuals/sc-if/sc-if.spec.ts
{ tag:"sc-if", category:"visual", attrs:{ bind:{type:"string",required:true} },
  content:{ choice:["blockContent"], mixed:true } }
```

### Groups, preamble, generator

- **Groups** (`internal/xsd/groups.ts`, `BLOCK_GROUPS`): one `<xs:group>` per category —
  `scInputs`/`scVisuals`/`scWidgets`/`scState`/`scNodes`/`scSynthDefs`; `blockContent` =
  `htmlElements` + those. `option`/`ugen` are child-only (no group; reached via a parent's
  `content.choice`, e.g. `sc-select` → `sc-option`).
- **Preamble** (`internal/xsd/preamble.xml`): the fixed hand-authored half — `commonAttrs`,
  the HTML scaffolding, `htmlElements`/`inlineContent`, the root, `blockType`/`inlineType`/
  `listType` — with `@generated:{elements,groups,complexTypes}` markers and a "do not edit"
  banner.
- **Generator** (`scripts/generate-xsd.ts`, `yarn generate:xsd`, via `tsx`): discovers specs
  (fs walk + dynamic import), asserts the spec↔`ELEMENTS` bijection, then emits — in
  `ELEMENTS` order for determinism — the element decls, the per-category groups + `blockContent`,
  and one `<xs:complexType>` per spec (exhaustive `switch` on `attr.type`; `enum` → inline
  `<xs:restriction>`; `required` → `use="required"`; `content.choice` refs → `<xs:group ref>`
  if a known group name else `<xs:element ref>`; `mixed` → `mixed="true"`). It splices the
  three blocks into the preamble's markers and writes the committed `.xsd`.

### Drift guards (vitest, in `yarn test`)

- `__tests__/xsd-generate.test.ts` — committed schema === `generateXsd()` (fails if a spec or
  the preamble changed without re-running `yarn generate:xsd`).
- `__tests__/xsd-reconcile.test.ts` — each spec's attribute names + coarse types match the
  component's `elementProperties` (by attribute name, so `sc-ugen`'s `type` ↔ its `ugen`
  property; `state`/converter props handled), and specs ↔ `ELEMENTS` is a bijection.

Verified: deterministic regen; `xmllint` accepts every example; `cargo test` loads the schema;
`yarn test` (163 + 41 + 84) / `build` / `lint` green. Regenerating surfaced real drift — the
old XSD's spurious `run` attribute on `sc-run` is gone.

### Changing the schema

Edit a `<tag>.spec.ts`, run `yarn generate:xsd`, run `yarn test`. Never hand-edit the `.xsd`
or the generated regions — the snapshot test will fail. Adding an element: create its
`.spec.ts` (the reconciliation test enforces one per `ELEMENTS` tag).

## Planned (Phase 2): the spec as the single runtime source

Phase 1 leaves two sources — the spec **and** the component's Lit `@property` declarations —
reconciled by a test (open problem 1). Phase 2 removes the second source by having the
components *read from the spec at runtime*, via two additions to `ScElement`. This also
single-sources validation (problems 2–3).

Framing: the `sc-*` elements are real reactive Lit components (they render and re-render), but
only a handful of fields are **genuinely reactive** — `value` (on slider/knob), `_checked`,
`_value`, `_state`, `_error`. Every other property is a **declarative attribute** parsed once
from the static plugin HTML and never mutated (`min`/`max`/`step`/`label`/`size`/`orientation`/
`bind`/`name`/`format`/`bus`/`channels`/`trigger`/…, and `value` on control/var/option/radio).
For those, Lit's reactive-property machinery is unused overhead.

### `getProp(name)` — read declarative attributes from the spec

`ScElement.getProp(name)` reads `getAttribute(name)` and coerces using the element's spec:
`decimal`/`integer` → `Number(...)`, `boolean` → boolean, `enum`/`string` → string, absent →
`undefined`. **Untyped by design** — it returns `string | number | boolean | undefined`; call
sites parse/cast where a concrete type is needed (`this.getProp("min") as number`, or wrap in
`Number(...)`). A `getProp("typo")` becomes a runtime `undefined`, not a compile error — an
accepted trade for dropping the machinery.

Components then **stop declaring the declarative attributes entirely** and keep only the ~5
genuinely-reactive fields as `@state`/reactive. The declarative attribute contract lives
**only in the spec** → open problem 1 is *eliminated*, not merely guarded, because the
component no longer restates it.

### `validateProps()` — spec-driven validation in `ScElement`

A base `ScElement.validateProps()` iterates the element's spec and checks, uniformly:
`required` present, numeric where `decimal`/`integer`, `enum` membership. It **replaces** the
per-element `requireProp`/`requireNumeric`/enum boilerplate. Each element's `validate()` keeps
only the *semantic* rules the spec can't express:

```ts
// ScElement
validate(): void { validateProps(this, specFor(this)); }
// ScState — the one rule the schema can't state (XSD 1.0)
validate(): void {
  super.validate();
  if (this.bind && this.getProp("value") !== undefined)
    failValidation(this, `"value" and "bind" are mutually exclusive`);
}
```

The `sc-radio-group` orientation check becomes redundant (its `enum` covers it), and
`required`/`enum` are now single-sourced from the spec — closing open problems 2 and 3 (schema
and runtime read the same declaration).

### The unifying point + prerequisite

Both additions require **the spec at runtime** — today specs are loaded only by the generator
and tests. Each component must reach its spec (import its own `spec`, or a bundled `SPECS`
registry keyed by tag). Once that exists, the spec is the single source for **three**
consumers: XSD generation (build-time), attribute coercion (`getProp`), and validation
(`validateProps`). The reconciliation test's cross-check then has nothing left to reconcile
for declarative attrs (the components no longer declare them); the snapshot test still guards
the committed schema against spec edits.

Cost: a per-component sweep (`this.min` → `this.getProp("min") as number`, remove the
`@property` accessors), keeping the ~5 reactive fields; and the pinned exact-message unit
tests change (validateProps emits uniform messages).

## Open problems & possible solutions

1. **Two sources, not one** — *addressed by Phase 2* (`getProp`): the declarative attribute
   contract moves entirely into the spec, so there is no second declaration to drift.
2. **Partial cross-check** (`required`/`enum` values have no component counterpart) —
   *addressed by Phase 2* (`validateProps` reads them from the spec, single-sourcing the check).
3. **Schema stricter than runtime on some attrs** (enum/required enforced at upload but not at
   parse) — *addressed by Phase 2*: both gates read the same spec.
4. **`fastxml` doesn't enforce everything the schema expresses.** libxml2 is lenient on content
   models (it accepts `bad-run-bind`, which a spec-correct validator rejects) and ignores
   `xs:pattern` (moot — `scName` was dropped, name syntax stays in JS `requireName`). So some
   generated facets are *documentation* under the current validator.
   → *Possible:* swap to a strict Rust validator (`uppsala`, pure-Rust zero-dep; or
   `semyonc/xsd-schema`, XSD 1.1 + assertions). Only `xsd-schema` additionally unlocks XSD 1.1
   `xs:assert` (e.g. value-XOR-bind). Separate track — evaluated earlier in the conversation.
5. **Inheritance is flattened by hand** — each input spec re-lists `bind`/`size`/`disabled`.
   → *Possible:* shared attr-group spreads (`...INPUT_ATTRS`); the reconciliation test catches
   mismatches meanwhile (and Phase 2 removes the component side of the duplication regardless).
6. **The generator must be run after editing a spec.** The snapshot test only *detects*
   staleness. → *Possible:* a pre-commit hook or CI step running the generator in `--check` mode.
7. **`.spec.ts` reads as "test file."** No collision (the runner glob is `*.test.ts`), but it's
   mildly ambiguous. → *Possible:* rename to `<tag>.xsd.ts` / `.schema.ts` (cosmetic).
8. **Content model is limited to a repeatable `choice` + `mixed`** — no `sequence`/`all` or
   per-item occurs; none of the generated elements needs them (ordered `head`/`html` content
   lives in the preamble). → *Possible:* add optional keys to `Content` if ever needed.

## Follow-ups

- **Phase 2** — `getProp` + `validateProps` as above (resolves problems 1–3). Needs the spec
  at runtime + the per-component sweep + updated message tests.
- **Phase 3** — single-source the runtime child-collection (`sc-select`/`sc-synthdef` filters)
  off `content.choice`.
- **Validator swap** — evaluate replacing `fastxml` (problem 4); separate from this work.
