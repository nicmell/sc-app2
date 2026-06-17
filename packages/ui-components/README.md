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
// 1. styling (once, at app boot) — adopt the ONE shared foundation stylesheet
//    onto the document. This is the same CSSStyleSheet that shadow-DOM widgets
//    (sc-select) adopt into their roots, so the foundation is parsed + shipped
//    once for the whole app. (Plain CSS consumers can still `import
//    "@sc-app/ui-components"` or <link> the dist instead — e.g. plugin HTML.)
import { adoptFoundation } from "@sc-app/ui-components/lit";
adoptFoundation();

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

Components are **light DOM** (except the shadow-DOM overlays `sc-select-base` /
`sc-popover-base` / `sc-modal-base`, see below), so the foundation's global CSS
styles them. **Events are native, not custom**: each
form widget renders a hidden native `<input>` under its visual overlay and lets
that input's real `input`/`change` flow to consumers — read `e.target.value` /
`e.target.checked`. The React wrappers expose `onChange` (+ `onInput` for live
controls). Containers (`sc-select-base`, `sc-radio-group-base`) coordinate their
declarative children via Lit context and fire a plain `change` from the host
(read `e.target.value`). `sc-button-base` uses the native `click` (React
`onClick`); `sc-toast-base` adds `dismiss`/`onDismiss`.

**Form participation:** every input takes a `name` and submits in a `<form>`
like a standard control. The hidden native input carries the `name` (checkbox/
switch/knob/slider, and the text inputs); `sc-radio-group-base` takes the `name`
and shares it with its radios (the checked one submits its `value`);
`sc-select-base` is a form-associated custom element (`ElementInternals`) and
submits its value under `name`.

## Component catalogue

Tag `sc-<name>-base` ↔ class `Sc<Name>Base` ↔ React `Sc<Name>`.

All form widgets fire native events; read `e.target.value` / `.checked`.

| component | key props | event | notes |
|---|---|---|---|
| `sc-checkbox-base` | `checked` `label` `size` `variant` `disabled` | native `change` | hidden `<input type=checkbox>` + box overlay |
| `sc-switch-base` | `checked` `size` `variant` `disabled` | native `change` | hidden checkbox (`role=switch`) + track/thumb |
| `sc-knob-base` | `value` `min` `max` `step` `size` `variant` `disabled` | native `input`/`change` | hidden `<input type=range>` + SVG dial; drag + wheel |
| `sc-slider-base` | `value` `min` `max` `step` `orientation` `size` `variant` `disabled` | native `input`/`change` | hidden range + track/fill/thumb; drag + wheel |
| `sc-option-base` | `value` `label` `size` `disabled` | — (reports via select context) | declarative child of `sc-select-base` |
| `sc-radio-base` | `value` `label` `checked` `size` `variant` `disabled` | — (reports via group context) | hidden `<input type=radio>` + ring/dot |
| `sc-radio-group-base` | `value` `orientation` `size` `variant` `disabled` | host `change` | context provider for `sc-radio-base` children |
| `sc-select-base` | `value` `placeholder` `size` `variant` `disabled` | host `change` | **shadow DOM**; combobox + **top-layer** dropdown of `<sc-option-base>` children |
| `sc-input-base` | `value` `placeholder` `type` `size` `disabled` | native `input`/`change` | text field over native `<input>` |
| `sc-inputnumber-base` | `value` `min` `max` `step` `placeholder` `size` `disabled` | native `input`/`change` | native spinners hidden, themed steppers; clamps on commit |
| `sc-textarea-base` | `value` `placeholder` `rows` `size` `disabled` | native `input`/`change` | multi-line |
| `sc-text-base` | `size` `weight` `tone` `font` `align` `truncate` `inline` | — | typography; renders children |
| `sc-alert-base` | `variant` | — | inline notice card; renders children (generalises legacy `.error`) |
| `sc-panel-base` | `disabled` | — | feature-surface card; a child `<header>` is the title bar; renders children |
| `sc-empty-base` | — | — | dashed "nothing here" placeholder; renders children |
| `sc-button-base` | `label` `icon` `trailingIcon` `iconOnly` `variant` `size` `disabled` `type` | native `click` | composes `sc-icon-base` |
| `sc-icon-base` | `name` `size` `label` | — | Phosphor **fill** glyph (needs the font) |
| `sc-badge-base` | `label` `variant` | — | uppercase pill |
| `sc-chip-base` | `label` `variant` `dot` | — | status chip (optional leading dot) |
| `sc-toast-base` | `message` `variant` | `dismiss` | lives in a `.toast-stack` (top-layer popover) |
| `sc-popover-base` | `open` `placement` `anchor` | `toggle` | **shadow DOM**; top-layer anchored panel (slots content) |
| `sc-modal-base` | `open` `dismissable` | `close` | **shadow DOM**; centred blocking modal over native `<dialog>` (slots content) |
| `sc-drawer-base` | `open` `side` `dismissable` | `close` | **shadow DOM**; edge-anchored slide-in panel over native `<dialog>` (slots content; child `<header>` = title bar) |

### Variant vocabularies (intentionally different)

- **Widgets** (checkbox/switch/knob/slider/radio/select via `ScWidgetBase`) —
  `variant` is a colour **accent**: `primary` (default) `neutral` `ok` `warn` `danger`.
- **`sc-button-base`** — `variant` is an **appearance**: `primary` (default)
  `secondary` `ghost` `danger`.
- **`sc-badge-base`** — `ok` (default) `warn` `error`.
- **`sc-chip-base`** — `neutral` (default) `ok` `warn` `error` `info`.
- **`sc-toast-base`** — `default` `success` `warn` `error` `info`.
- **`sc-text-base`** — `tone`: `default` `dim` `mute` `faint` `primary` `ok` `warn` `error` `info`.
- **`sc-alert-base`** — `variant`: `info` (default) `success` `warn` `error`.

`size` is `sm | md | lg` everywhere it appears (md default).

## Architecture patterns

Most components are **light DOM** (`createRenderRoot() → this`) so the global
foundation CSS applies. Four patterns:

1. **Hidden native input + visual overlay (form widgets).** checkbox, switch,
   knob, slider, radio render a hidden, focusable native `<input>` (`.sr-only`)
   under their SVG/CSS overlay. The input owns value, keyboard, focus, and fires
   the genuine native `input`/`change`; the overlay reflects state via CSS
   sibling selectors (`.sc-x__input:checked ~ …`) or, for knob/slider, redraws
   from the value. No CustomEvent.

2. **Inner element + `classnames` (badge, chip, button, icon, the inputs'
   chrome).** A template whose root carries `cx("sc-x", \`sc-x--\${variant}\`, …)`;
   CSS targets those classes (`.sc-badge--warn`). Variant/size resolve to
   **classes, not data attributes** — the migration away from `[data-variant]`.

3. **Host-only + reflected attributes (`sc-text-base`, `sc-alert-base`,
   `sc-panel-base`, `sc-empty-base`).** Content wrappers that preserve author
   children by rendering **no template** (`render()` returns `noChange`) and
   style the host off reflected props (`sc-text-base[size="lg"]`,
   `sc-alert-base[variant="warn"]`, `sc-panel-base[disabled]`). The alert/panel/
   empty share their chrome with the legacy `.error`/`.panel`/`.empty` classes
   (kept for plugin authors), e.g. `:where(sc-alert-base), .error { … }`.

4. **Lit context containers (`sc-radio-group-base`, `sc-select-base`).** A
   `@lit/context` provider coordinates declarative children (the consumers):
   selection + size/variant/disabled flow down; the host fires `change`.
   `radio-group` is light-DOM (children preserved, no template). `select` is the
   **one shadow-DOM component** — it must render combobox/dropdown chrome *and*
   project the `<sc-option-base>` children into the dropdown via `<slot>`, which
   a light-DOM render would clobber. Its chrome therefore lives in
   `foundations/components/sc-select.css` (`:host` + `.sc-select__*`) like every
   other component, applied inside the shadow because the select **adopts the
   shared foundation stylesheet** into its shadow root (see below). Note:
   providers are registered before consumers so static markup upgrades with the
   provider already listening.

Shared bits for the form widgets live on `internal/sc-widget-base.ts`
(`ScWidgetBase`): `size`/`variant`/`disabled`, the light-DOM render root, and the
`blockClasses()` helper. It is abstract — not a tag. The parent↔child contexts
live in `internal/contexts.ts`.

### One shared foundation stylesheet

`internal/foundation-styles.ts` builds the foundation CSS (`index.css?inline`)
into a **single `CSSStyleSheet`** (`foundationStyles`). The app adopts it onto
the document (`adoptFoundation()`), and shadow-DOM components adopt the *same
object* into their roots (`static styles = [foundationStyles]`). Adopting by
reference does **not** copy it — the browser parses/stores it once and shares it
across the document and every shadow root, so the foundation ships once. Any
future shadow component just reuses `foundationStyles` — nothing per-component.

> Per-component `:host` rules in the shared sheet are scoped to their tag
> (`:host(sc-select-base)`, `:host(sc-popover-base)`): a bare `:host` would
> match in **every** shadow root that adopts the one shared sheet. At the
> document level `:host(...)` matches nothing (inert).

### Overlays (top layer)

Dropdowns, modals, and toasts must escape clipping and stacking: an
`overflow`/`transform` ancestor (e.g. a `react-grid-layout` dashboard cell)
traps an absolutely-positioned child, and `z-index` battles are fragile. The
only correct escape is the browser **top layer**, reached two ways:

- **`PopoverController`** (`internal/popover-controller.ts`) — a Lit
  `ReactiveController` that turns a panel into a `popover="auto"` element
  (top layer + native light-dismiss: outside-click + Esc) and positions it
  against an anchor with [`@floating-ui/dom`](https://floating-ui.com)
  (`offset`/`flip`/`shift`, `strategy: "fixed"`, re-positioned via `autoUpdate`).
  Used by **`sc-popover-base`** (a generic anchored panel; anchors to its
  `anchor` property or previous sibling) and directly by **`sc-select-base`**
  (the combobox carries `popovertarget`, so the browser owns the toggle +
  light-dismiss; the controller only positions). Guarded — degrades to
  in-flow CSS positioning where the Popover API is absent.

- **Native `<dialog>`** for **`sc-modal-base`** and **`sc-drawer-base`** —
  `showModal()` gives the top layer, a `::backdrop`, a focus trap, and Esc for
  free; no anchoring, so no floating-ui. The shared open/close/dismiss lifecycle
  lives in `internal/sc-dialog-base.ts` (`dismissable` gates Esc + backdrop; a
  blocking instance swallows `cancel` and re-asserts itself if the UA
  force-closes it). The modal is centred; the **drawer** is the same dialog
  pinned to a viewport edge (`side` = right | left), sliding in/out via native
  CSS (`@starting-style` + `transition-behavior: allow-discrete`), no JS
  animation. A drawer is *edge*-anchored, not trigger-anchored — floating-ui
  would have nothing to do.

The app's **toast stack** is a `popover="manual"` element for the same reason
(never clipped). A modal `<dialog>` still renders above popovers in the top
layer, so toasts don't cover an open modal — but they're corner-placed and
modals are centred, so they don't overlap.

> **Platform note:** macOS Tauri runs in WKWebView (WebKit), where CSS anchor
> positioning isn't available — hence `@floating-ui/dom` for the math and the
> Popover API (Safari 17+) for the layer. happy-dom has no top layer or layout,
> so the open/close/positioning behaviour is verified in a real browser via the
> CDP harness; unit tests cover structure + state + events only.

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
