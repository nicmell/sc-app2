# Draft: generating the XSD from per-component spec files

Status: **draft for later planning**, grounded in the real code. Not an implementation.
Reflects the current codebase as of the transparency + name-syntax commits (`9ce260c`
sc-if full transparency + sc-group port, `4379e53` `scName` validation).

## Approach (revised)

Earlier drafts hung the schema metadata on the component classes (`static xsd` +
`@property({ xsd })`, read via `elementProperties`). **This draft takes the other route:**
a dedicated, colocated **`<component>.spec.ts`** per element that declares its whole XSD
surface as plain data, and a generator that reads *only the specs* to emit
`sc-plugin-schema.xsd`.

Why the switch:

- **The generator becomes runtime-free.** A spec imports nothing but a type and a couple of
  shared consts — no Lit, no `window`/`Worker`, no `.scss`. `tsx scripts/generate-xsd.ts`
  runs it with zero happy-dom/stub gymnastics (the class-introspection route dragged the
  whole app runtime at import).
- **The components stay clean** — no schema concern bleeding into `@property`.
- **The specs speak XML, not JS** — keys are attribute names as authored (`sc-ugen`'s
  attribute is `type`, even though the class property is `ugen`), so there's no rename
  indirection to reason about.

The cost is duplication/drift against the class (see **Problems**), closed by a
reconciliation test.

## File layout

```
src/sc-elements/
  inputs/sc-slider/sc-slider.ts
  inputs/sc-slider/sc-slider.spec.ts      ← colocated, one per component
  …
  internal/xsd/
    types.ts        ElementSpec / AttrSpec / Content (below)
    named-types.ts  the shared simpleType registry (scName)
    groups.ts       category → content-group config
    preamble.xml    fixed HTML scaffolding + @generated markers
```

`.spec.ts` is **not** matched by the vitest glob (`src/**/*.test.{ts,tsx}`), so these never
run as tests. (Naming aside: `.spec.ts` conventionally means "test" in many ecosystems — no
runner collision here, but `.xsd.ts` / `.schema.ts` would be less ambiguous. Cosmetic.)

## The spec type

```ts
// internal/xsd/types.ts
export interface ElementSpec {
  tag: string;                       // "sc-slider" — must match an ELEMENTS entry
  category: Category;                // feeds content-group membership
  attrs: Record<string, AttrSpec>;   // attribute name (as authored) → descriptor
  content: Content;
}

export type Category =
  | "input" | "visual" | "widget"    // the scControls union
  | "state" | "node" | "synthdef"    // + the blockContent extras
  | "ugen" | "option";               // child-only (referenced explicitly, not via a group)

// ── attributes: a discriminated union on `type`, `required` common to all ──
interface AttrCommon { required?: boolean }        // → use="required" | "optional"
export type AttrSpec =
  | (AttrCommon & { type: "string" })                            // xs:string
  | (AttrCommon & { type: "decimal" })                           // xs:decimal
  | (AttrCommon & { type: "integer" })                           // xs:integer
  | (AttrCommon & { type: "boolean" })                           // xs:boolean
  | (AttrCommon & { type: "enum"; values: readonly string[] })   // inline restriction
  | (AttrCommon & { type: "named"; ref: string });               // ref a shared simpleType (scName)

// ── content model: a discriminated union on `kind` ──
export type ContentRef =
  | { kind: "element"; tag: string }   // <xs:element ref="sc-option"/>
  | { kind: "group"; ref: string };    // <xs:group ref="blockContent"/>
export type Content =
  | { kind: "empty" }                                                     // attrs only
  | { kind: "text" }                                                      // mixed, PCDATA only
  | { kind: "children"; accepts: readonly ContentRef[]; text?: boolean }; // choice; text ⇒ mixed
```

`kind` (not `type`) discriminates `content`/`ContentRef` on purpose: on an attribute `type`
genuinely is the XSD datatype; a content model is a structural shape, not a datatype.
(Switch to `type` everywhere if you prefer one discriminant name — purely cosmetic.)

The `content` variants, and what each emits:

| variant | XSD output |
|---|---|
| `{ kind: "empty" }` | `<xs:complexType>` with attributes only |
| `{ kind: "text" }` | `<xs:complexType mixed="true">`, no particle |
| `{ kind: "children"; accepts; text }` | `mixed=text` + `<xs:choice minOccurs="0" maxOccurs="unbounded">` of the refs |

No `sequence` variant: every generated sc-element uses an unordered repeatable choice; the
only ordered content (`head`→`title`, `html`→`head,body`) lives in the hand-authored
preamble. A future ordered element would add `{ kind: "sequence"; steps: … }` — the union
extends cleanly.

## Every component's spec (the full set)

Grouped by category. These cover every `AttrSpec` variant (string/decimal/integer/boolean/
enum/named) and every `Content` variant (empty/text/children-element/children-group+mixed),
and match each element's current `validate()` + XSD `required` rules. `commonAttrs`
(`id`/`class`/`title`/`style`) is added to every type by the generator, so specs omit it.

### state — `content: empty`, `name` is `scName`-required, `value` xor `bind` (runtime-only)

```ts
// state/sc-control/sc-control.spec.ts
export const spec: ElementSpec = {
  tag: "sc-control", category: "state",
  attrs: {
    name:  { type: "named", ref: "scName", required: true },
    value: { type: "decimal" },
    bind:  { type: "string" },
  },
  content: { kind: "empty" },
};
// state/sc-var/sc-var.spec.ts — identical shape, tag "sc-var".
```

### nodes — containers

```ts
// nodes/sc-group/sc-group.spec.ts
export const spec: ElementSpec = {
  tag: "sc-group", category: "node",
  attrs: { name: { type: "named", ref: "scName", required: true }, run: { type: "boolean" } },
  content: { kind: "children", accepts: [{ kind: "group", ref: "blockContent" }], text: true },
};

// nodes/sc-synth/sc-synth.spec.ts
export const spec: ElementSpec = {
  tag: "sc-synth", category: "node",
  attrs: {
    name: { type: "named", ref: "scName", required: true },
    bind: { type: "string" },
    run:  { type: "boolean" },
  },
  content: { kind: "children", accepts: [{ kind: "element", tag: "sc-control" }] },
};
```

### synthdef / ugen — child element lists

```ts
// synthdef/sc-synthdef/sc-synthdef.spec.ts
export const spec: ElementSpec = {
  tag: "sc-synthdef", category: "synthdef",
  attrs: { name: { type: "named", ref: "scName", required: true } },
  content: {
    kind: "children",
    accepts: [{ kind: "element", tag: "sc-control" }, { kind: "element", tag: "sc-ugen" }],
  },
};

// synthdef/sc-ugen/sc-ugen.spec.ts — attribute is `type` (class prop `ugen`), required
export const spec: ElementSpec = {
  tag: "sc-ugen", category: "ugen",
  attrs: {
    name: { type: "named", ref: "scName", required: true },
    type: { type: "string", required: true },
    rate: { type: "string" },
    op:   { type: "string" },
  },
  content: { kind: "children", accepts: [{ kind: "element", tag: "sc-control" }] },
};
```

### inputs — the widget surface (`size` is the shared enum; `bind` required where the widget writes)

```ts
// inputs/sc-slider/sc-slider.spec.ts — every attr optional (bind optional; numerics validated)
export const spec: ElementSpec = {
  tag: "sc-slider", category: "input",
  attrs: {
    bind: { type: "string" },
    min:  { type: "decimal" }, max: { type: "decimal" }, step: { type: "decimal" }, value: { type: "decimal" },
    label: { type: "string" },
    size:  { type: "enum", values: ["sm", "md", "lg"] },
    orientation: { type: "enum", values: ["horizontal", "vertical"] },
    disabled: { type: "boolean" },
  },
  content: { kind: "empty" },
};
// inputs/sc-knob/sc-knob.spec.ts — identical minus `orientation` (a knob has none).

// inputs/sc-checkbox/sc-checkbox.spec.ts — bind REQUIRED
export const spec: ElementSpec = {
  tag: "sc-checkbox", category: "input",
  attrs: {
    bind: { type: "string", required: true },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { kind: "empty" },
};
// inputs/sc-switch/sc-switch.spec.ts — bind REQUIRED; no `label` (the base switch has none).

// inputs/sc-select/sc-select.spec.ts — bind REQUIRED, children = sc-option
export const spec: ElementSpec = {
  tag: "sc-select", category: "input",
  attrs: {
    bind: { type: "string", required: true },
    placeholder: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { kind: "children", accepts: [{ kind: "element", tag: "sc-option" }] },
};

// inputs/sc-radio-group/sc-radio-group.spec.ts — bind REQUIRED, children = sc-radio
export const spec: ElementSpec = {
  tag: "sc-radio-group", category: "input",
  attrs: {
    bind: { type: "string", required: true },
    orientation: { type: "enum", values: ["horizontal", "vertical"] },
    label: { type: "string" },
    size: { type: "enum", values: ["sm", "md", "lg"] },
    disabled: { type: "boolean" },
  },
  content: { kind: "children", accepts: [{ kind: "element", tag: "sc-radio" }] },
};

// inputs/sc-run/sc-run.spec.ts — bindless targets the parent node (legacy size/src/colors dropped, decision 2)
export const spec: ElementSpec = {
  tag: "sc-run", category: "input",
  attrs: { bind: { type: "string" } },
  content: { kind: "empty" },
};
```

### options — child-only data (`value` + `label` required)

```ts
// inputs/sc-option/sc-option.spec.ts   (and sc-radio/sc-radio.spec.ts — identical, category "option")
export const spec: ElementSpec = {
  tag: "sc-option", category: "option",
  attrs: { value: { type: "decimal", required: true }, label: { type: "string", required: true } },
  content: { kind: "empty" },
};
```

### visuals

```ts
// visuals/sc-display/sc-display.spec.ts — bind REQUIRED
export const spec: ElementSpec = {
  tag: "sc-display", category: "visual",
  attrs: { bind: { type: "string", required: true }, format: { type: "string" } },
  content: { kind: "empty" },
};

// visuals/sc-if/sc-if.spec.ts — bind REQUIRED; transparent blockContent container (mixed)
export const spec: ElementSpec = {
  tag: "sc-if", category: "visual",
  attrs: { bind: { type: "string", required: true } },
  content: { kind: "children", accepts: [{ kind: "group", ref: "blockContent" }], text: true },
};
```

> Transparency (sc-if / sc-select / sc-radio-group parse into the enclosing scope) is a
> **runtime** property; the XSD does not — and should not — encode it. sc-if accepts full
> `blockContent` (identical to sc-group as of `9ce260c`); sc-select/sc-radio-group are also
> transparent yet still restrict content to `sc-option`/`sc-radio`. So `content` is declared
> per element regardless of transparency, and the schema stays a plain structural grammar.

### widgets

```ts
// widgets/sc-console/sc-console.spec.ts
export const spec: ElementSpec = { tag: "sc-console", category: "widget", attrs: {}, content: { kind: "empty" } };

// widgets/sc-scope/sc-scope.spec.ts — the integer + enum + decimal mix
export const spec: ElementSpec = {
  tag: "sc-scope", category: "widget",
  attrs: {
    bus: { type: "integer" }, channels: { type: "integer" }, frames: { type: "integer" },
    trigger: { type: "enum", values: ["auto", "normal", "off"] },
    slope:   { type: "enum", values: ["rising", "falling"] },
    level: { type: "decimal" }, gain: { type: "decimal" },
    layout: { type: "enum", values: ["overlay", "split"] },
  },
  content: { kind: "empty" },
};

// widgets/sc-strudel/sc-strudel.spec.ts — the text-content case
export const spec: ElementSpec = {
  tag: "sc-strudel", category: "widget",
  attrs: { orbit: { type: "integer" } },
  content: { kind: "text" },
};
```

(`sc-plugin` has no spec — it's the app-synthesized host, never authored in plugin HTML.)

## Shared config

```ts
// internal/xsd/named-types.ts — one place; the pattern is the same source requireName reads
export const NAMED_TYPES = {
  scName: { pattern: "[A-Za-z_][A-Za-z0-9_]*(-[A-Za-z_][A-Za-z0-9_]*)*" },
} as const;

// internal/xsd/groups.ts — groups are category UNIONS, not hand-listed element lists
export const GROUP_DEFS = {
  scControls:   { categories: ["input", "visual", "widget"] },
  blockContent: { include: ["htmlElements", "scControls"], categories: ["state", "node", "synthdef"] },
} as const;
```

`htmlElements` / `inlineContent` and the `html`/`head`/`body` scaffolding stay in
`preamble.xml` (decision 4).

## The generator (runtime-free)

`scripts/generate-xsd.ts`, run via `tsx`:

1. Glob `src/sc-elements/**/*.spec.ts`, import each `spec` (pure data — no app runtime).
2. Build `category → [tag]` from the specs; expand `GROUP_DEFS` into `<xs:group>`s.
3. Per spec, emit `<xs:complexType>` — attributes from `attrs`, content from `content`:
   ```ts
   const attrType = (a: AttrSpec): string => {
     switch (a.type) {
       case "string":  return `type="xs:string"`;
       case "decimal": return `type="xs:decimal"`;
       case "integer": return `type="xs:integer"`;
       case "boolean": return `type="xs:boolean"`;
       case "named":   return `type="${a.ref}"`;
       case "enum":    return INLINE_RESTRICTION;   // nested <xs:simpleType>…<xs:enumeration>
       default: { const _never: never = a; throw new Error(`unhandled ${JSON.stringify(_never)}`); }
     }
   };
   // content: switch (c.kind) { case "empty" | "text" | "children" … default: never }
   ```
   The exhaustive `switch` + `never` fallthrough is the payoff of the discriminated unions:
   a new attr/content variant fails to compile until the generator handles it.
4. Emit `NAMED_TYPES` as shared `<xs:simpleType>`s; add `commonAttrs` to every complex type.
5. Splice groups + simpleTypes + complexTypes into `preamble.xml`'s markers; write the `.xsd`.

## Drift guards

- **Snapshot test** — regenerate in memory, assert equal to the committed `.xsd`.
- **Reconciliation test** (the linchpin — runs under vitest/happy-dom, where the classes
  import): for every `ELEMENTS` tag, load its class + its spec and assert
  - the attribute sets agree — `spec.attrs` keys ⟷ non-`state` `elementProperties`
    (compared by *attribute* name, `d.attribute ?? key`, so the spec's `type` matches
    sc-ugen's `ugen` prop);
  - coarse types agree — `Number`↔`decimal|integer`, `Boolean`↔`boolean`, else `string`;
  - `ELEMENTS` ⟷ specs is a bijection (no orphan spec, no unspecced element).

## Problems

1. **Drift — the core one.** A spec restates attribute names/types that also live as
   `@property` on the class; nothing *forces* the two to agree. This is a real regression in
   single-sourcing vs the on-class plan. **The reconciliation test is mandatory, not
   optional** — without it, this design is a drift trap. Note the irony: that test
   re-imports the classes at runtime, so the coupling isn't eliminated, just relocated from
   the generator into a test.
2. **Inheritance is flattened by hand.** Lit gives inputs `bind` (from `ScInput`) and
   `size`/`disabled` (from bases) for free via its merge; every input spec must now re-list
   them. Mitigate with shared spreads (`...INPUT_ATTRS`) — but that re-models the class
   hierarchy in spec-land.
3. **Only a partial cross-check.** The class carries coarse `type: Number`; the spec carries
   precise `decimal`/`integer` — reconciliation can verify only the coarse mapping. Enums,
   patterns, `required`, and content models have **no class counterpart** → those parts of a
   spec are trust-the-author (a wrong enum list can't be caught by any test).
4. **Two files per component.** More to keep in sync (that's #1) and discover (colocation
   helps the latter, not the former).

## Confirmed decisions (carried over)

- **Drop the legacy presentational attrs** (`width`/`height`/`src`/`sprites`/`fgcolor`/
  `bgcolor`/`diameter`); they're absent from the specs above. Codemod the examples that use
  them:
  ```bash
  perl -i -pe 's/\s+(width|height|diameter|sprites|src|fgcolor|bgcolor)="[^"]*"//g' \
    examples/**/index.html examples/**/entry.html
  ```
- **Single-source `required` + `scName`.** The spec's `required` and `{ type: "named",
  ref: "scName" }` are the schema truth; the runtime `requireProp`/`requireName` should read
  the *same* spec (or the shared `NAMED_TYPES` pattern) so schema and parser can't diverge.
- **Hand-authored `preamble.xml`** holds the HTML scaffolding + `htmlElements`/`inlineContent`
  + the `<xs:element name type>` refs; the generator splices into its markers.

## Note: generated facets are only *enforced* under a strict validator

Richer facets are only worth generating if something enforces them. The current backend
validator — **fastxml (libxml2) — does not enforce `xs:pattern`** (verified twice, incl. by
`4379e53`'s `scName` testing), so under fastxml the pattern/enum facets are **documentation**
and the runtime stays the gate. Two strict Rust validators tested against our real XSD
(`uppsala`, pure-Rust zero-dep; `semyonc/xsd-schema`, XSD 1.1 + XPath 2.0) match fastxml on
every example *except* where fastxml is silently lenient, and would enforce these facets at
upload: content model (`bad-run-bind`), the `scName` pattern (probed — `uppsala` rejects
`name="s1.freq"`), and — only `xsd-schema` — XSD 1.1 `<xs:assert>` (bind/value exclusivity).
So the codegen and the validator choice are complementary; generating the facets is cheap
regardless, but their upload-time value is unlocked by moving off fastxml.

## Phasing

- **Phase 1** — the spec files + `types.ts`/`named-types.ts`/`preamble.xml` + the generator +
  both drift guards. Drop legacy attrs + codemod examples.
- **Phase 2** — single-source `required`/`scName` back into the runtime `validate()` from the
  specs, so the two gates share one source.
- **Phase 3** — optionally single-source the runtime child-collection (sc-select/sc-synthdef
  filters) off the spec's `content.accepts`.
