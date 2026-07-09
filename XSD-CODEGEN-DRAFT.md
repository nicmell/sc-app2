# XSD generation from per-component spec files

Status: **Phase 1 + Phase 2 implemented** (branch `xsd-codegen-draft`). The spec is now the
single source for the XSD (build-time), attribute coercion (`getProp`), and validation
(`validateProps`) — open problems 1–3 are closed. Phase 3 (single-sourcing the runtime
child-collection off `content.choice`) remains.

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
- The generator's `assertBijection` (surfaced by the snapshot test) keeps specs ↔ `ELEMENTS` a
  bijection. (Phase 1 also had `xsd-reconcile.test.ts`, cross-checking spec ↔ component
  `elementProperties`; Phase 2 deleted it — the components no longer declare the attrs.)

Verified: deterministic regen; `xmllint` accepts every example; `cargo test` loads the schema;
`yarn test` (163 + 41 + 84) / `build` / `lint` green. Regenerating surfaced real drift — the
old XSD's spurious `run` attribute on `sc-run` is gone.

### Changing the schema

Edit a `<tag>.spec.ts`, run `yarn generate:xsd`, run `yarn test`. Never hand-edit the `.xsd`
or the generated regions — the snapshot test will fail. Adding an element: create its
`.spec.ts` (the generator's bijection check enforces one per `ELEMENTS` tag). At runtime the
component reads that same spec through `getProp`/`validateProps` (see Phase 2) — no `@property`
declarations for declarative attrs.

## As built (Phase 2): the spec as the single runtime source

Phase 1 left two sources — the spec **and** the component's Lit `@property` declarations —
reconciled by a test (open problem 1). Phase 2 removed the second source: the components now
*read from the spec at runtime*, via two additions to `ScElement` and a runtime spec registry.
This also single-sources validation (problems 2–3).

Framing: the `sc-*` elements are real reactive Lit components (they render and re-render), but
only a handful of fields are **genuinely reactive** — kept as `@property`/`@state`: `value` (on
slider/knob), `_checked` (checkbox/switch), `_value` (select/radio-group), `_state` (ScDerived),
`_error` (plugin), and sc-strudel's `requestUpdate()`-backed status fields. Every OTHER property
was a **declarative attribute** parsed once from the static plugin HTML and never mutated
(`min`/`max`/`step`/`label`/`size`/`orientation`/`bind`/`name`/`format`/`bus`/`channels`/
`trigger`/`run`/`type`/`rate`/`op`/…, and `value` on control/var/option/radio). Those lost
their `@property` accessors entirely.

### The runtime spec registry (`internal/xsd/registry.ts`)

`SPECS` is a `Map<tag, ElementSpec>` collected with `import.meta.glob("**/*.spec.ts", { eager })`
(the pattern `examples.test.ts` already used) — so a new `.spec.ts` is picked up with no manual
registration, in both the app bundle and vitest. `ScElement.spec` looks the element up by
`tagName`.

### `getProp(name)` — read declarative attributes from the spec

`ScElement.getProp(name)` reads `getAttribute(name)` and coerces using the element's spec:
`decimal`/`integer` → `Number(...)`, `boolean` → `raw !== "false"` (unifies `run`/`disabled`),
`enum`/`string` → string, absent → `undefined`. **Untyped by design** — it returns
`string | number | boolean | undefined`; call sites cast where a concrete type is needed
(`this.getProp("min") as number`). A `getProp("typo")` becomes a runtime `undefined`, not a
compile error — an accepted trade for dropping the machinery. Absent → `undefined` means a
forwarded widget prop falls through to the base widget's own default; the one element that
consumes numerics directly (`sc-scope`) keeps private getters that apply its constant defaults
(`(this.getProp("bus") as number) ?? SCOPE_INPUT_BUS`).

The declarative attribute contract now lives **only in the spec** → open problem 1 is
*eliminated*, not merely guarded, because the component no longer restates it. (The
reconciliation test that cross-checked spec ↔ `elementProperties` was deleted — there is nothing
left to reconcile; the spec ↔ `ELEMENTS` bijection stays guarded by the generator.)

### `validateProps()` — spec-driven validation in `ScElement`

`ScElement.validateProps()` iterates the element's spec and checks, uniformly: `required`
present, numeric where `decimal`/`integer`, `enum` membership. `process()` calls it **before**
`validate()`. Its messages are byte-identical to the old per-element `requireProp`/
`requireNumeric`/enum ones, so the pinned exact-message tests were unaffected — except
`sc-radio-group`'s orientation (now the uniform "must be one of horizontal|vertical", not pinned)
and `sc-option`/`sc-radio` `value`/`label` which are now *required* at parse (matching the XSD's
`use="required"` — this is problem 3, schema-stricter-than-runtime, closing).

Each element's `validate()` keeps only the *semantic* rules the spec can't express: `ScState`'s
value-XOR-bind + `requireName` syntax; the node/synthdef/ugen `requireName`; `sc-ugen`'s
`rate` ∈ `ar|kr|ir` (a plain-string attr, defaulted to `ar`); `sc-scope`'s range rules
(non-negative/positive/≤max/gain>0) + `requireNoScChildren`; `sc-strudel`'s orbit range. Most
input leaves (`sc-slider`/`sc-knob`/`sc-checkbox`/`sc-switch`/`sc-select`/`sc-display`/`sc-if`/
`sc-option`/`sc-radio`) dropped `validate()` entirely — `validateProps` covers them.

### Verified

`yarn test` (142 + 41 + 84), `yarn build`, `yarn lint`, `cargo test` (53) green;
`yarn generate:xsd` produces **no diff** (specs/generator/XSD untouched by Phase 2). The
per-component sweep touched `ScElement`, the 4 category bases, ~18 leaves, and the behavior
tests' direct prop reads (`def.name` → `def.getProp("name")`, `scope.trigger` → the private
getter via cast, `scope.trigger = …` → `setAttribute`).

## Open problems & possible solutions

1. **Two sources, not one** — ✅ *closed by Phase 2* (`getProp`): the declarative attribute
   contract lives entirely in the spec; the components no longer declare it.
2. **Partial cross-check** (`required`/`enum` values had no component counterpart) — ✅ *closed
   by Phase 2* (`validateProps` reads them from the spec, single-sourcing the check).
3. **Schema stricter than runtime on some attrs** (enum/required enforced at upload but not at
   parse) — ✅ *closed by Phase 2*: both gates read the same spec (e.g. `sc-option` `value`/
   `label` are now required at parse too).
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

- **Phase 3** — single-source the runtime child-collection (`sc-select`/`sc-synthdef` filters)
  off `content.choice`.
- **Validator swap** — evaluate replacing `fastxml` (problem 4); separate from this work.
