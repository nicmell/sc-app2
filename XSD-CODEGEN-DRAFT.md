# Draft: generating the XSD from the sc-element classes

Status: **draft for later planning**, grounded in probes run against the real code
(vitest introspection). Not an implementation. Reflects the current codebase (Lit
`@property`/`@state` decorators) as of the transparency + name-syntax commits
(`9ce260c` sc-if full transparency + sc-group port, `4379e53` `scName` validation).

## Verdict

Feasible. The source of truth is each element class's finalized **`elementProperties`**
map, which yields the per-element **attribute name list + a coarse type + which props
are internal**. The rest of the current XSD (required-ness, int-vs-decimal,
enumerations, content models / allowed children, the HTML scaffolding) is **not**
carried by Lit property declarations and must be supplied by a small amount of extra
metadata on the classes plus a hand-authored preamble.

## The introspection seam (attributes)

After `registerScElements()` (which triggers Lit's `finalize()`), every element class
exposes `elementProperties: Map<PropertyKey, PropertyDeclaration>` — the merged set,
**including inherited props** (`ScSlider.elementProperties` contains `bind` from
`ScInput`, `size`/`disabled` from the category bases). Per attribute we read:

| descriptor field | use for XSD |
|---|---|
| the map key, or `d.attribute` (string) if renamed | `<xs:attribute name>` (`sc-ugen`'s `ugen` → attribute `type`) |
| `d.type?.name` → `"Number"` / `"Boolean"` / `null` | coarse base type (Number→numeric, Boolean→`xs:boolean`, else `xs:string`) |
| `d.state === true` / `d.attribute === false` | **exclude** — internal reactive state (`_value`, `_checked`, `open`, `_error`) |
| `d.xsd` (custom key, ignored by Lit) | the schema hints (int/decimal/enum/pattern/namedType/required) |

Gotchas confirmed by probe: `JSON.stringify` drops `{ type: Number }` (functions aren't
serialisable) — read the descriptor objects directly. Importing the classes pulls the app
runtime (`window`, `Worker`) at module load, so the generator runs in the vitest/happy-dom
env (which stubs them) or a vite-node harness that pre-stubs them.

## Gaps — what Lit property declarations do NOT carry (vs today's XSD)

1. **required** — `name` on control/var/synth/group; `value` on option/radio. In `validate()`.
2. **int vs decimal** — `type: Number` can't tell `xs:integer` (`bus`, `channels`, `frames`,
   `sprites`, `orbit`) from `xs:decimal` (`min`, `max`, `step`, `level`, `gain`, `value`).
   The default value can't disambiguate (`bus = 0` and `min = 0` are both integer literals).
3. **enumerations** — `trigger` (auto|normal|off), `slope`, `layout`, `orientation`, `size` —
   TS union types are erased at runtime.
4. **patterns / shared named simpleTypes** — `4379e53` added `scName` (a
   `<xs:simpleType>` with an `<xs:pattern>`) referenced by every `name` attribute. A pattern
   facet, and the fact that many attributes share ONE named type, aren't in the property
   declaration; the runtime side lives in `requireName` (`internal/validation.ts`).
5. **content model / allowed children** — entirely absent (see the dedicated section below).
6. **legacy presentational attrs** — allowed in the XSD but not declared as props
   (`width`, `height`, `src`, `sprites`, `fgcolor`, `bgcolor`, `diameter`).
7. **HTML scaffolding** — `html`/`head`/`body`/`title`, `div`/`p`/`span`/…, the
   `htmlElements`/`inlineContent` groups. Pure HTML, unrelated to any class.

## Design status of the five decisions

| # | decision | status |
|---|---|---|
| 2 | Drop the legacy presentational attrs (+ codemod the examples) | ✅ **CONFIRMED** |
| 3 | Single-source `required` through a metadata-driven `validate()` | ✅ **CONFIRMED** |
| 4 | Hand-authored `xsd-preamble.xml` + generate only the complex-type bodies | ✅ **CONFIRMED** |
| 1 | Where attribute metadata lives / how it's typed | proposed below |
| — | **Content / children validation** — how it's declared & generated | proposed below |
| 5 | Runtime introspection vs ts-morph static extraction | proposed below |

### Confirmed (2, 3, 4) — recap

- **2 — drop legacy attrs.** They're dead (base widgets size via `size`, not pixels); a
  generated schema should describe what elements actually accept, not carry a meaning-less
  allowlist. One-time codemod on the examples that use them:
  ```bash
  perl -i -pe 's/\s+(width|height|diameter|sprites|src|fgcolor|bgcolor)="[^"]*"//g' \
    examples/**/index.html examples/**/entry.html
  ```
- **3 — single-source `required`.** The same `xsd.required` that emits `use="required"`
  drives the runtime gate, so schema and parser can't diverge. Base loop; subclasses keep
  the semantic rules:
  ```ts
  // ScElement.validate() (base)
  for (const [key, d] of (this.constructor as typeof ScElement).elementProperties)
    if (d.xsd?.required) requireProp(this, d.attribute ?? String(key), (this as any)[key]);
  // ScState.validate() adds value-XOR-bind via super.validate()
  ```
  (Lands Phase 2/3 — it moves the pinned error-message source, so the message tests change
  in the same commit.)
- **4 — preamble template.** `xsd-preamble.xml` holds the fixed HTML scaffolding + the
  `<xs:element name type>` refs; the generator replaces one marked region:
  ```xml
  <!-- xsd-preamble.xml -->  … html/head/body, htmlElements, inlineContent …
    <!-- @generated:groups -->
    <!-- @generated:complexTypes -->
  ```

---

## Content / children validation — the proposal

This is the part worth getting right, and the one `elementProperties` can't touch at all:
**Lit knows nothing about an element's children.** So the content model must be *declared*.
The goal is a declaration that (a) is colocated/single-sourced and (b) removes the current
footgun.

### What the current XSD content model actually is

Cataloguing every element:

| shape | elements |
|---|---|
| **empty** (attributes only) | sc-console, sc-scope, sc-slider, sc-knob, sc-checkbox, sc-switch, sc-run, sc-display, sc-control, sc-var, sc-option, sc-radio |
| **text only** (`mixed`, no child elements) | sc-strudel |
| **explicit child tags** | sc-synthdef → (sc-control \| sc-ugen); sc-ugen → sc-control; sc-synth → sc-control; sc-select → sc-option; sc-radio-group → sc-radio |
| **group refs** (`mixed`) | sc-group → `blockContent`; sc-if → `blockContent` (as of `9ce260c` — was `htmlElements`+`scControls`; now identical to sc-group) |

And the shared **groups** are category unions:
- `scControls` = **input** (slider, knob, checkbox, switch, run, select, radio-group) ∪
  **visual** (display, if) ∪ **widget** (console, scope, strudel).
- `blockContent` = `htmlElements` ∪ `scControls` ∪ **state** (control, var) ∪
  **node-container** (group, synth) ∪ **synthdef**.

### Why this is a footgun today

`scControls` and `blockContent` are hand-maintained element lists. Adding `sc-knob` and
`sc-switch` earlier meant manually editing **three** places each (the `<xs:element>` decl,
the `scControls` group, and — transitively — `blockContent`). Miss one and the schema
silently rejects (or silently allows) the element with no error pointing at the cause. The
lists duplicate a fact each element already "knows": *what kind of thing it is.*

### The proposal: category-driven groups + a tiny per-element content shape

Two declarations, both on the class:

```ts
// src/sc-elements/internal/xsd-meta.ts
export type XsdCategory =
  | "input" | "visual" | "widget"     // the scControls union
  | "state" | "node" | "synthdef"     // + the blockContent extras
  | "ugen" | "option";                // graph-internal / child-only data

export type XsdContent =
  | "empty"                                     // leaf — attributes only
  | { text: true }                              // mixed, text only (sc-strudel)
  | { accepts: string[]; text?: boolean };      // choice of group names and/or element tags

export interface XsdElementMeta { category: XsdCategory; content: XsdContent }
```

**`category` can largely be *derived*, not re-declared.** The runtime already has a
category system the generator can reuse: `isNodeRuntime` / `isStateRuntime` (guards.ts) and
`isTransparent` (validation.ts, added in `9ce260c` = a nameless non-node sc element). node
and state fall out of the guards; the input/visual/widget split is the remaining ambiguity
(they're all "transparent-or-leaf non-state non-node"), so at most that trichotomy needs an
annotation — or derive it from the source directory (`inputs/`, `visuals/`, `widgets/`).
Either way `content` still has to be declared per element (the guards don't know a
`sc-select` takes `sc-option`).

Per element (colocated with the class it describes):

```ts
class ScScope   { static xsd: XsdElementMeta = { category: "widget", content: "empty" }; }
class ScStrudel { static xsd: XsdElementMeta = { category: "widget", content: { text: true } }; }
class ScSelect  { static xsd: XsdElementMeta = { category: "input",  content: { accepts: ["sc-option"] } }; }
class ScSynthDef{ static xsd: XsdElementMeta = { category: "synthdef", content: { accepts: ["sc-control", "sc-ugen"] } }; }
class ScIf      { static xsd: XsdElementMeta = { category: "visual", content: { accepts: ["blockContent"], text: true } }; }
class ScGroup   { static xsd: XsdElementMeta = { category: "node",   content: { accepts: ["blockContent"], text: true } }; }
```

The **groups are derived, not listed** — defined once as category unions:

```ts
const GROUP_DEFS = {
  scControls:   { categories: ["input", "visual", "widget"] },
  blockContent: { include: ["htmlElements", "scControls"], categories: ["state", "node", "synthdef"] },
};
```

**Generator** (Phase 2):
1. Read `cls.xsd.category` for every element in `ELEMENTS` → build `category → [tags]`.
2. Emit each `<xs:group>` from `GROUP_DEFS` by expanding its categories to tags (+ any
   static group includes). → `@generated:groups` region of the preamble.
3. Emit each `<xs:complexType>`'s content from `cls.xsd.content`:
   - `"empty"` → attributes only;
   - `{ text: true }` → `mixed="true"`, no child choice;
   - `{ accepts, text }` → `mixed=text` + `<xs:choice minOccurs="0" maxOccurs="unbounded">`
     of `<xs:group ref>` (group names) / `<xs:element ref>` (element tags).

### Payoff

Adding a new input element becomes **one line** — `static xsd = { category: "input", content: "empty" }`
— and it automatically joins `scControls` **and** `blockContent` and gets the right
complex type. The three-places-or-it-breaks maintenance disappears, and the category is
declared where it's obvious (on the element), not in a schema file far away.

### Single-source opportunity (Phase 3)

Some elements already re-encode `accepts` imperatively — `ScSelect.resolveRuntime` filters
`sc-option` children; `ScSynthDef` collects `sc-control`+`sc-ugen`. Those filters could read
`static xsd.content.accepts`, so the runtime collection and the schema share one list (the
same single-sourcing idea as `required`). Aspirational, not required for generation.

### Transparency is a runtime property — the XSD does NOT encode it

`9ce260c` made sc-if / sc-select / sc-radio-group **transparent** (nameless non-node
containers whose contents parse into the enclosing scope). Two consequences for codegen:

- **Content model ≠ transparency.** They're orthogonal. sc-if now accepts full
  `blockContent`; sc-select/sc-radio-group are *also* transparent yet still restrict content
  to `sc-option`/`sc-radio`. So the generator declares `content` per element regardless of
  transparency and **never emits anything about transparency** — the schema stays a plain
  structural grammar. (The old "sc-if must not contain nodes" rule is gone; `bad-if-node`
  was retired.)
- **The upload gate vs the parse gate stay separate.** The XSD is the upload/structural
  gate; the runtime parse engine keeps its own orthogonal semantics — transparency's flat
  duplicate-name check (`bad-if-shadow`), `requireName`'s `scName` syntax (`bad-name-syntax`),
  bind resolution, circular-bind. Those live in `validate()`/the engine and the generated
  schema doesn't replace them.

---

## Point 1 — attribute metadata: `xsd` key on `@property`, typed by declaration merging

**The split, stated plainly:** facts *about one attribute* ride on that attribute's
`@property`; facts *about the element as a whole* (category, content) ride on `static xsd`.
There's no single attribute to hang "what children are allowed" on, so it must be class-level;
conversely "is this number an integer" belongs to that number, so it rides the property.

```ts
export class ScScope extends ScElement {
  @property({ type: Number, xsd: { kind: "integer" } }) accessor bus = 0;      // per-attribute
  @property({ type: Number, xsd: { kind: "decimal" } }) accessor level = 0;    // per-attribute
  @property({ xsd: { enum: ["auto", "normal", "off"] } }) accessor trigger = "auto";
  static xsd: XsdElementMeta = { category: "widget", content: "empty" };       // per-element
}
```

Why on the field and not a sidecar map (`{ "sc-scope": { bus: {...} } }`)? A sidecar drifts
the instant someone adds a prop and forgets the table, and the generator can't detect the
omission. On the field it's reviewed with the prop and impossible to miss.

**Typing:** a bare `xsd` key errors under TS (`PropertyDeclaration` has no such member). Fix
it once with declaration merging, then every call site is checked and autocompletes:

```ts
declare module "@lit/reactive-element" {
  interface PropertyDeclaration {
    xsd?: {
      kind?: "integer" | "decimal";
      enum?: readonly string[];
      namedType?: string;   // reference a shared simpleType, e.g. "scName"
      required?: boolean;
    };
  }
}
```

**Shared named simpleTypes (the `scName` case from `4379e53`).** `name` is not a plain
string — it's an `scName` (`<xs:simpleType>` with an `<xs:pattern>`) reused across every
named element. So a per-attribute inline facet isn't the right model for it: the type is
*shared*. Handle it as a small **registry of named simpleTypes** the generator emits once
into the preamble, with attributes referencing them by name:

```ts
// generator-side (or a `static`-exported constant reused by the runtime guard)
const NAMED_TYPES = {
  scName: { pattern: "[A-Za-z_][A-Za-z0-9_]*(-[A-Za-z_][A-Za-z0-9_]*)*" },
};
// on the element:
@property({ xsd: { namedType: "scName", required: true } }) accessor name = "";
```

The generator emits `<xs:simpleType name="scName">…</xs:simpleType>` once and each `name`
attribute becomes `type="scName"`. Bonus single-sourcing: `requireName`'s regex and the
`scName` pattern are the *same* rule in two places today — the `NAMED_TYPES` entry can be the
one source both read (the pattern string compiles to the runtime `RegExp`), the same
drift-killer as `required`.

## Point 5 — runtime introspection now; ts-morph only if enum duplication bites

Two ways to read the classes:

| | runtime (`elementProperties`) | ts-morph (static AST) |
|---|---|---|
| inheritance merge (`bind`, `size` on inputs) | **free** — Lit's `finalize()` does it | must re-implement by following `extends` |
| TS union types (enums) | **invisible** — needs explicit `xsd.enum` | **readable** — `"auto"\|"normal"\|"off"` directly |
| runtime deps | drags `window`/`Worker` → run under happy-dom/stubs | none — never executes |
| fidelity | exact same registry the app uses | source-as-written; can't eval computed defaults |
| cost | ~none (test env already imports these) | a parser dependency + more code |

**Recommendation: runtime primary.** The inheritance merge is the expensive thing to
reproduce, and runtime gives it for free — the input elements genuinely inherit `bind`/`size`/
`disabled` from their bases, and I'd rather not hand-roll Lit's merge in a parser. The only
thing runtime can't see is the TS union, so enums carry an explicit `xsd.enum` — a handful of
props (`trigger`, `slope`, `layout`, `orientation`, `size`). If that duplication ever becomes a
smell, add a *narrow* ts-morph pass that reads only the union types for enum props and leave
everything else on the runtime path — a hybrid, not a rewrite. At today's scale, explicit
`xsd.enum` is the smaller cost.

---

## Note: generated facets are only *enforced* under a strict validator

Generating richer facets (patterns, enums, precise int/decimal, content models) is only
worth the effort if something enforces them. The current backend validator, **fastxml
(libxml2), does not enforce `xs:pattern` facets** — verified twice now, including by
`4379e53`'s own testing of `scName`. So under fastxml these generated facets are
**documentation**; the runtime `validate()` stays the real gate.

Two independent strict Rust validators tested against our real XSD (`uppsala`, pure-Rust
zero-dep; `semyonc/xsd-schema`, XSD 1.1 + XPath 2.0) agree with fastxml on every example
**except** the cases where fastxml is silently lenient — and they'd enforce these generated
facets at upload:

- content model — both reject `bad-run-bind` (`sc-run` inside `sc-synth`), fastxml passes it;
- `scName` pattern — probed: `uppsala` rejects `name="s1.freq"` at the schema level (fastxml ignores it);
- and only `xsd-schema` additionally does XSD 1.1 `<xs:assert>` (the bind/value exclusivity).

Implication: **the codegen and the validator choice are complementary.** Generating the
facets is cheap and single-sources the schema regardless; but their upload-time value is
unlocked by moving off fastxml. If we stay on fastxml, prioritise generating the *structure*
(attributes + content models, which fastxml does enforce) and treat patterns/enums as
documentation that the runtime mirrors. See the validator comparison in the conversation
history for the full trade-off (maturity vs XSD 1.1 assertions).

## Phasing

- **Phase 1** — attributes only: `elementProperties` + per-prop `xsd` hints → `<xs:attribute>`
  lists + `<xs:complexType>`s (content still hand-authored in the preamble). Emit the shared
  named simpleTypes (`scName`) + reference them. Drop legacy attrs + codemod examples.
  Snapshot drift test. Declaration-merge the `xsd` type.
- **Phase 2** — content/children: `static xsd.content` (+ `category`, derived from the
  existing guards / `isTransparent` where possible) → generated `scControls`/`blockContent`
  groups + per-element content. Metadata-driven `required` (and `scName`, sharing one pattern
  source with `requireName`). Retire the hand-authored groups.
- **Phase 3** — fully generated (only the fixed HTML preamble stays static); optionally
  single-source the runtime child-collection off `xsd.content.accepts`.
