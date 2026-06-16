# `@sc-app/ui-components`

The sc-app design system: a CSS **foundation** (tokens, base element styles,
semantic-class primitives) plus a library of framework-agnostic **`-base`
components** (Lit web components with React wrappers).

Three consumers:

1. **The React host** (`src/`) — imports the foundation CSS once in
   `src/main.tsx`, registers the web components, and uses the React wrappers.
2. **Lit widgets** (`src/sc-elements/*`) — render the `-base` tags directly.
3. **Runtime HTML plugins** (trusted, light DOM) — load the built
   `dist/index.css` and use the `-base` tags / foundation classes, inheriting
   the host's look with no bundle of their own.

## Layout

```
src/
  foundations/             pure CSS — tokens, reset, base elements, classes
    index.css              entry; @imports every layer in cascade order
    tokens/semantic.css    --color-* / --space-* / --radius-* / type / shadow  (PUBLIC API)
    themes/{dark,light}.css  dark = default at :root; light under [data-theme="light"]
    base/{elements,typography}.css   bare button/input/select/textarea/label/headings/code
    components/*.css        styling for the semantic classes + every -base component
  components/
    lit/                   the -base Lit web components + registerUiComponents()
      internal/sc-widget-base.ts   abstract base for the interactive widgets
    react/                 @lit/react wrappers (one per component) + barrel
```

### Entry points (package `exports`)

| import | what |
|---|---|
| `@sc-app/ui-components` | the foundation CSS (source; Vite resolves the `@import` chain) — **required for any styling** |
| `@sc-app/ui-components/dist` | the bundled, autoprefixed `dist/index.css` for build-less plugin runtime |
| `@sc-app/ui-components/lit` | the web components + `registerUiComponents()` |
| `@sc-app/ui-components/react` | the React wrappers (importing the barrel registers the elements) |
| `@sc-app/ui-components/tokens` `/themes/dark` `/themes/light` `/reset` | individual CSS layers |

## Using the components

```ts
// 1. styling (once, at app boot)
import "@sc-app/ui-components";

// 2a. as web components (Lit / plugin HTML)
import { registerUiComponents } from "@sc-app/ui-components/lit";
registerUiComponents();            // idempotent; defines every <sc-*-base> tag
// → <sc-button-base label="Run" variant="danger"></sc-button-base>

// 2b. as React components
import { ScButton, ScSelect } from "@sc-app/ui-components/react";
// → <ScButton label="Run" variant="danger" onClick={…} />

// 3. icons only: load the Phosphor fill font once (peer dependency)
import "@phosphor-icons/web/fill";  // powers <sc-icon-base>
```

Every component is **light DOM**, so the foundation's global CSS styles it.
Interactive widgets emit a `change` `CustomEvent` (read `e.detail.value`); the
React wrappers expose it as `onChange`. `sc-button-base` uses the native `click`
(React `onClick`); `sc-toast-base` adds `dismiss`/`onDismiss`.

## Component catalogue

Tag `sc-<name>-base` ↔ class `Sc<Name>Base` ↔ React `Sc<Name>`.

| component | key props | event | notes |
|---|---|---|---|
| `sc-checkbox-base` | `checked` `label` `size` `variant` `disabled` | `change {value:0\|1}` | |
| `sc-switch-base` | `checked` `size` `variant` `disabled` | `change {value:0\|1}` | track + sliding thumb |
| `sc-knob-base` | `value` `min` `max` `step` `size` `variant` `disabled` | `change {value:number}` | SVG dial; drag + wheel |
| `sc-slider-base` | `value` `min` `max` `step` `orientation` `size` `variant` `disabled` | `change {value:number}` | drag + wheel |
| `sc-option-base` | `value` `label` `selected` `size` `disabled` | `change {value:number}` | single option row |
| `sc-radio-base` | `value` `label` `checked` `size` `variant` `disabled` | `change {value:number}` | child of radio-group |
| `sc-radio-group-base` | `value` `orientation` `size` `variant` `disabled` | `change {value:number}` | coordinates `sc-radio-base` children |
| `sc-select-base` | `value` `options:{value,label}[]` `placeholder` `size` `variant` `disabled` | `change {value:number}` | combobox + dropdown |
| `sc-input-base` | `value` `placeholder` `type` `size` `disabled` | `change {value:string}` | text field over native `<input>` |
| `sc-inputnumber-base` | `value` `min` `max` `step` `placeholder` `size` `disabled` | `change {value:number}` | native spinners hidden, themed steppers |
| `sc-textarea-base` | `value` `placeholder` `rows` `size` `disabled` | `change {value:string}` | multi-line |
| `sc-text-base` | `size` `weight` `tone` `font` `align` `truncate` `inline` | — | typography; renders children |
| `sc-button-base` | `label` `icon` `trailingIcon` `iconOnly` `variant` `size` `disabled` `type` | native `click` | composes `sc-icon-base` |
| `sc-icon-base` | `name` `size` `label` | — | Phosphor **fill** glyph (needs the font) |
| `sc-badge-base` | `label` `variant` | — | uppercase pill |
| `sc-chip-base` | `label` `variant` `dot` | — | status chip (optional leading dot) |
| `sc-toast-base` | `message` `variant` | `dismiss` | lives in a `.toast-stack` |

### Variant vocabularies (intentionally different)

- **Widgets** (checkbox/switch/knob/slider/radio/select via `ScWidgetBase`) —
  `variant` is a colour **accent**: `primary` (default) `neutral` `ok` `warn` `danger`.
- **`sc-button-base`** — `variant` is an **appearance**: `primary` (default)
  `secondary` `ghost` `danger`.
- **`sc-badge-base`** — `ok` (default) `warn` `error`.
- **`sc-chip-base`** — `neutral` (default) `ok` `warn` `error` `info`.
- **`sc-toast-base`** — `default` `success` `warn` `error` `info`.
- **`sc-text-base`** — `tone`: `default` `dim` `mute` `faint` `primary` `ok` `warn` `error` `info`.

`size` is `sm | md | lg` everywhere it appears (md default).

## The two rendering patterns

Both keep components in **light DOM** (`createRenderRoot() → this`) so the global
foundation CSS applies. They differ in how a component carries its styling:

1. **Inner element + `classnames` (most components).** The component renders a
   template whose root carries `cx("sc-x", \`sc-x--\${variant}\`, …)`. CSS targets
   those classes (`.sc-checkbox--ok`). Variant/size resolve to **classes, not
   data attributes** — the deliberate migration away from the old
   `[data-variant]` pattern. Used by every component that owns its markup.

2. **Host-only + reflected attributes (`sc-radio-group-base`, `sc-text-base`).**
   These must preserve **author-provided children** (radio children; text/inline
   content), so they render **no template** — `LitElement`'s default `render()`
   returns `noChange`, leaving children untouched. They style the **host** off
   reflected props via attribute selectors (`sc-text-base[size="lg"]`).
   Reflecting (rather than `classList` in `updated()`) avoids racing a host
   `className` set by React.

Shared bits for the interactive widgets live on `internal/sc-widget-base.ts`
(`ScWidgetBase`): `size`/`variant`/`disabled`, the light-DOM render root, the
`blockClasses()` helper, and `emit(value:number)`. It is abstract — not a tag.

## Build

```bash
yarn build          # PostCSS: inline @imports + autoprefix → dist/index.css
yarn build:watch
yarn typecheck      # tsc over the TS components (chained into the root typecheck)
yarn test           # vitest + happy-dom behaviour suite
```

The package ships **source** (`./src/foundations/index.css`, resolved by the
host's Vite) and a **bundled** `dist/index.css` (for plugin runtime).

## Demo

`demo.html` renders the foundation + every `-base` component. The widgets need
the TS modules transpiled and decorators lowered, so **serve it through Vite**:

```bash
npx vite            # from packages/ui-components/, then open the printed URL
```

(Opening the file directly still shows the CSS-only foundation sections.)

## Constraints

- **Plain CSS only** in `foundations/` — no Sass/Tailwind/nesting; PostCSS does
  only `@import` inlining + autoprefixing.
- **Light DOM cascade.** Selectors stay shallow so plugin HTML under the same
  root behaves predictably.
- **Tokens are the public API.** Renaming a `--color-*` / `--space-*` / selector
  is a breaking change for plugin authors; add freely, rename only with a major bump.
- **`-base` components are UI-only.** No OSC, store, or bind logic — the logical
  `sc-elements` in the host app wrap them to add behaviour.
