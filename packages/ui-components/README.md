# `@sc-app/ui-components`

The sc-app design system: a CSS **foundation** (tokens, themes, reset, base
element styles) plus a library of framework-agnostic **`-base` components** (Lit
web components with React wrappers). **Every component is shadow DOM** and styles
itself uniformly: `static styles = [foundations, styles]` — the shared font-free
`foundations` (shadow base) plus its own **`sc-x.css`**, each compiled to a Lit
`CSSResult` by `vite-plugin-lit-css`. No CSS Modules, no per-component `unsafeCSS`.

> The package ships **no build** — consumers (the app, the `example/`, vitest) import
> its TS + `.css` **source** directly and Vite compiles it, so editing a component
> reflects immediately (no rebuild). `vite-plugin-lit-css` (configured in each
> consumer's Vite config) turns the components' `.css` into Lit CSSResults.

Three consumers:

1. **The React host** (`src/`) — imports the full foundation as a `<head>` stylesheet
   in `src/main.tsx` (`import "@sc-app/ui-components"`, for the light-DOM app shell +
   document-wide font), registers the web components, and uses the React wrappers.
2. **Lit widgets** (`src/sc-elements/*`) — render the `-base` tags directly.
3. **Runtime HTML plugins** (trusted) — register the components and use the
   `-base` tags, inheriting the host's look with no bundle of their own.

## Layout

```
src/
  foundations/             CSS — tokens, reset, base element styles, icon font
    index.css             FULL foundation → head <link>; @import tokens + themes + reset + base + icons
    shadow.css            font-free shadow base (reset + base elements) → the `foundations` export
    tokens/semantic.css   --color-* / --space-* / --radius-* / type / shadow  (PUBLIC API)
    themes/{dark,light}.css  dark = default at :root; light under [data-theme="light"]
    base/{elements,typography}.css  bare button/input/select/textarea/label/headings/code
    icons.css            Phosphor icon font (@font-face + .ph-* rules); woff2 emitted as separate /assets files
  components/              the -base Lit web components + their co-located styles
    sc-<tag>/sc-<tag>.ts        the component: `static styles = [foundations, styles]`,
                                renders a shadow tree using literal class names
    sc-<tag>/sc-<tag>.css      the component's own CSS (→ a Lit CSSResult via vite-plugin-lit-css)
    index.ts               element barrel + registerUiComponents()
    internal/foundation-styles.ts   the shared font-free `foundations` CSSResult (= shadow.css)
    internal/widget-base.css        shared widget styles (sr-only, variant accents, disabled)
    internal/sc-widget-base.ts       abstract base for the graphical widgets
    react.ts               all @lit/react wrappers (one-liners) in a single file
```

(`example/` is a standalone Vite showcase that consumes the package source; see Demo
below. Each consumer's Vite config wires `vite-plugin-lit-css` to wrap the components'
`.css` into CSSResults — `foundations/index.css` is excluded so it stays a plain
head stylesheet.)

### Entry points (package `exports`)

| import | what |
|---|---|
| `@sc-app/ui-components` | the foundation CSS — tokens + themes + reset + base (component styles ship with the components, not here) |
| `@sc-app/ui-components/lit` | the web components + `registerUiComponents()` (each component self-styles via `static styles`) |
| `@sc-app/ui-components/react` | the React wrappers (importing the barrel registers the elements) |
| `@sc-app/ui-components/tokens` `/themes/dark` `/themes/light` `/reset` | individual CSS layers |

## Using the components

```ts
// 1. foundation (once, at app boot) — a side-effect import puts the full foundation
//    (tokens + reset + base + the Phosphor @font-face) in the document <head> as a
//    render-blocking stylesheet, so the first paint is styled and the font registers
//    document-wide. Shadow components adopt only the font-free subset themselves.
import "@sc-app/ui-components";

// 2a. as web components (Lit / plugin HTML)
import { registerUiComponents } from "@sc-app/ui-components/lit";
registerUiComponents();            // idempotent; defines every <sc-*-base> tag
// → <sc-button-base label="Run" variant="danger"></sc-button-base>

// 2b. as React components
import { ScButton, ScSelect } from "@sc-app/ui-components/react";
// → <ScButton label="Run" variant="danger" onClick={…} />

// 3. icons: nothing extra to load — the head foundation registers the Phosphor font
//    (regular | fill | duotone) and <sc-icon-base> carries the .ph-* rules in its
//    shadow. <sc-icon-base name="play"> just works.
```

Every component is **shadow DOM**, styled by `static styles = [foundations,
styles]` (see "Styling" below). **Events are composed, read off the host**: each
form widget renders a hidden native `<input>` inside its shadow and re-emits a
composed `input`/`change` from the host (native events don't cross the shadow
boundary) — consumers read `e.target.value` / `e.target.checked` on the host. The
React wrappers expose `onChange` (+ `onInput` for live controls). Containers
(`sc-select-base`, `sc-radio-group-base`) coordinate their declarative children
via Lit context and fire a plain `change` from the host. `sc-button-base` relays
the native (composed) `click` (React `onClick`); `sc-toast-base` adds
`dismiss`/`onDismiss`.

**No form participation.** The components are shadow DOM and deliberately do NOT
submit in a `<form>` (no `ElementInternals`). Read values via the events above or
`el.value` / `el.checked`. `name` is still forwarded to the hidden native input
(for radio grouping + a11y).

## Component catalogue

Tag `sc-<name>-base` ↔ class `Sc<Name>Base` ↔ React `Sc<Name>`. Every component
is shadow DOM; form widgets re-emit composed events — read `e.target.value` /
`.checked` on the host.

| component | key props | event | notes |
|---|---|---|---|
| `sc-checkbox-base` | `checked` `label` `size` `variant` `disabled` | native `change` | hidden `<input type=checkbox>` + box overlay |
| `sc-switch-base` | `checked` `size` `variant` `disabled` | native `change` | hidden checkbox (`role=switch`) + track/thumb |
| `sc-knob-base` | `value` `min` `max` `step` `label` `size` `variant` `disabled` | native `input`/`change` | hidden `<input type=range>` + SVG dial; drag + wheel; `label`→aria-label |
| `sc-slider-base` | `value` `min` `max` `step` `orientation` `label` `size` `variant` `disabled` | native `input`/`change` | hidden range + track/fill/thumb; drag + wheel; `label`→aria-label |
| `sc-option-base` | `value` `label` `size` `disabled` | — (reports via select context) | declarative child of `sc-select-base` |
| `sc-radio-base` | `value` `label` `checked` `size` `variant` `disabled` | — (reports via group context) | hidden `<input type=radio>` + ring/dot |
| `sc-radio-group-base` | `value` `orientation` `label` `size` `variant` `disabled` | host `change` | context provider for `sc-radio-base` children; `role=radiogroup`, `label`→aria-label |
| `sc-select-base` | `value` `placeholder` `size` `variant` `disabled` | host `change` | **shadow DOM**; combobox + **top-layer** dropdown of `<sc-option-base>` children |
| `sc-input-base` | `value` `placeholder` `type` `size` `disabled` | native `input`/`change` | text field over native `<input>` |
| `sc-inputnumber-base` | `value` `min` `max` `step` `placeholder` `size` `disabled` | native `input`/`change` | native spinners hidden, themed steppers; clamps on commit |
| `sc-textarea-base` | `value` `placeholder` `rows` `size` `disabled` | native `input`/`change` | multi-line |
| `sc-text-base` | `size` `weight` `tone` `font` `align` `truncate` `inline` | — | typography; renders children |
| `sc-alert-base` | `variant` | — | inline notice card; renders children (state palette via `variant`) |
| `sc-panel-base` | `disabled` | — | feature-surface card; a child `<header>` is the title bar; renders children |
| `sc-empty-base` | — | — | dashed "nothing here" placeholder; renders children |
| `sc-stack-base` | `gap` | — | vertical flex layout; renders children |
| `sc-cluster-base` | `gap` | — | horizontal flex layout (wraps); renders children |
| `sc-disclosure-base` | `open` | `toggle` | **shadow DOM**; collapsible card over native `<details>` (`summary` slot + content) |
| `sc-button-base` | `label` `icon` `trailingIcon` `iconOnly` `variant` `size` `disabled` `type` | native `click` | composes `sc-icon-base` |
| `sc-icon-base` | `name` `variant` `size` `label` | — | Phosphor glyph (font ships in the foundation); `variant` = regular (default) \| fill \| duotone |
| `sc-badge-base` | `label` `variant` | — | uppercase pill |
| `sc-chip-base` | `label` `variant` `dot` | — | status chip (optional leading dot) |
| `sc-progress-base` | `variant` `value` `max` `size` `label` | — | loading/progress indicator; `bar`/`spinner`, determinate when `value` set else indeterminate; `role=progressbar` |
| `sc-toast-base` | `message` `variant` | `dismiss` | lives in a `.sc-toast-stack` (top-layer popover) |
| `sc-popover-base` | `open` `placement` `anchor` | `toggle` | **shadow DOM**; top-layer anchored panel (slots content) |
| `sc-modal-base` | `open` `dismissable` `label` | `close` | **shadow DOM**; centred blocking modal over native `<dialog>` (slots content); `label`→aria-label |
| `sc-drawer-base` | `open` `side` `dismissable` `label` | `close` | **shadow DOM**; edge-anchored slide-in panel over native `<dialog>` (slots content; child `<header>` = title bar); `label`→aria-label |

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
- **`sc-progress-base`** — `variant` is the **shape**, not a colour: `bar`
  (default) `spinner`.

`size` is `sm | md | lg` everywhere it appears (md default). `gap` (stack/
cluster) is a monotonic `xs | sm | md | lg` mapping 1:1 to `--space-{xs,sm,md,lg}`
(8 / 12 / 16 / 20px), default `xs`.

## Architecture patterns

**Every component is shadow DOM** (the default Lit render root). It renders its
own tree using **literal class names** (the shadow scopes them — no hashing
needed) and styles itself with `static styles = [foundations, styles]`. Nothing
is styled by tag or attribute selector; modifiers are classes on a shadow
element, and `:host` only sets the host box display. Four patterns:

1. **Hidden native input + visual overlay (form widgets).** checkbox, switch,
   knob, slider, radio render a hidden, focusable native `<input>` (`.sr-only`)
   under their SVG/CSS overlay. The input owns value, keyboard, and focus; the
   overlay reflects state via CSS sibling selectors (`.input:checked ~ …`) or, for
   knob/slider, redraws from the value. Native events don't cross the shadow
   boundary, so each widget **re-emits a composed `input`/`change` from the host**
   (read `e.target.value` / `.checked`).

2. **Label / inner element (badge, chip, toast, button, icon, the inputs'
   chrome).** A shadow tree whose root carries `cx("root", variant, …)`. Variant/
   size resolve to **classes, not data attributes**.

3. **Content / layout wrappers (`sc-text-base`, `sc-alert-base`,
   `sc-panel-base`, `sc-empty-base`, `sc-stack-base`, `sc-cluster-base`).** Render
   a `.root` element (with a size/tone/gap/variant modifier class) wrapping a
   `<slot>` for the author's children. `sc-panel-base` styles a slotted
   `<header>` via `::slotted(header)`. `sc-disclosure-base` renders a native
   `<details>`/`<summary>` (open/close + a11y free), projecting the author's
   `summary` slot + body and syncing the native `toggle` into a controllable
   `open` prop.

4. **Lit context containers (`sc-radio-group-base`, `sc-select-base`).** A
   `@lit/context` provider coordinates declarative children (the consumers):
   selection + size/variant/disabled flow down; the host fires `change`. Both
   render a `<slot>` for their children — the children stay light-DOM, so their
   context-request events still bubble to the host provider. The accent reaches
   each child by passing `variant` through the context (the child self-applies
   the accent class in its own shadow), not by a cross-boundary custom property.
   Providers are registered before consumers so static markup upgrades with the
   provider already listening.

Shared bits for the form widgets live on `internal/sc-widget-base.ts`
(`ScWidgetBase`): the `size`/`variant`/`disabled`/`name` props and the
`widgetClasses(extra?)` helper (joins `"root"` + `size` + `variant` + `disabled`).
The shared widget styles (`.sr-only`, the variant→`--_accent` accents,
`.disabled`) are `internal/widget-base.css`, included in each widget's
`static styles`. `ScWidgetBase` is abstract — not a tag. The parent↔child
contexts live in `internal/contexts.ts`.

### Styling — one foundation + a `.css` per component

Each component owns its styles as a co-located `sc-x.css`, imported as a Lit
`CSSResult` (`vite-plugin-lit-css` runs it through Vite's CSS pipeline + wraps it),
and composes it with the shared `foundations`:

```ts
import { foundations } from "../internal/foundation-styles";
import styles from "./sc-x.css";               // → CSSResult (vite-plugin-lit-css)
static styles = [foundations, styles];          // adopted into the shadow root
```

`internal/foundation-styles.ts`'s `foundations` is the **font-free shadow base**
(`foundations/shadow.css`: reset + bare `input{}`/`button{}`/etc. element styles),
adopted into **every** component's shadow. It is NOT the full foundation: the design
tokens reach shadow roots via custom-property inheritance from the document, and the
icon font is registered document-wide (not parsed into any shadow sheet). The **full**
foundation (`foundations/index.css` — tokens + themes + reset + base + the Phosphor
`@font-face` + `.ph-*` rules) ships as a render-blocking `<link>` in the document
`<head>` (a side-effect `import "@sc-app/ui-components"` in the app/example entries; no
`adoptFoundation()`), so the first paint is styled (no FOUC). Class names are literal but
**shadow-scoped**, so they never collide across components and there's no hashing.

Two notes on shadow-DOM styling:

- **Slotted content** (a panel/drawer `<header>`, etc.) is light DOM, so it's
  styled with `::slotted(...)` from the component's own css — the component does
  not expose global classes for consumers to hook.
- **Icon font.** `<sc-icon-base>` renders `<i class="ph ph-<name>">`. The Phosphor
  `@font-face` (weights regular/fill/duotone) is registered document-wide by the head
  foundation `<link>` (it has no effect inside a shadow root). `<sc-icon-base>` is the
  only component that renders a raw `<i class="ph">`, so it additionally adopts
  `foundations/icons.css` as a CSSResult (`static styles = [foundations, glyphs, styles]`)
  for the `.ph-*` content rules in its shadow. The woff2 is emitted as separate `/assets`
  files by Vite (resolved by the head `<link>`); `@phosphor-icons/web` stays a
  build-time-only dependency.

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
yarn typecheck      # tsc over the TS components
yarn test           # vitest + happy-dom behaviour suite (source .css via litCss)
# No build step — the app/example/vitest compile this package's source directly.
```

There is **no build step**. `exports` point at the TS + `.css` **source**, and each
consumer's Vite (the app, `example/`, vitest) compiles it. `vite-plugin-lit-css` patches
Vite's `css-post` plugin so the components' `.css` run through Vite's own CSS pipeline
(@import inlining, asset emission) and are then wrapped into Lit `CSSResult`s. The
foundation CSS exports (`.`/`/tokens`/`/reset`/`/themes/*`) point at the `.css` sources.

> **Consumer requirement.** A consumer wiring `vite-plugin-lit-css` **must** exclude the
> foundation entry so it stays a plain stylesheet for the `<head>`:
>
> ```ts
> litCss({
>   include: ["**/ui-components/src/**/*.css"],
>   exclude: ["**/ui-components/src/foundations/index.css"],
> })
> ```
>
> Without the `exclude`, `import "@sc-app/ui-components"` gets lifted into a `CSSResult`:
> its `@font-face` woff2 URLs dangle as unresolved `__VITE_ASSET__` placeholders, the 1 MB
> of fonts lands in the JS bundle, and the render-blocking `<head>` link (the FOUC fix)
> never happens. (See `vite.config.ts` / `example/vite.config.ts` for the working setup.)

## Demo

`example/` is a **standalone Vite workspace** that consumes the package **source**
(`@sc-app/ui-components/lit`) — it renders the foundation + every `-base` component,
with HMR. No build needed:

```bash
yarn demo           # from packages/ui-components/ — `vite example` (serves the source)
```

## Constraints

- **Plain CSS, compiled on demand.** Component styles are `.css` → Lit `CSSResult`
  (the `litCss` Vite plugin + PostCSS: import/nesting/url); the foundation is `.css`
  too. Consumers compile the source — no `dist`, no build step.
- **Shadow-encapsulated components.** Each component is a shadow root styled by
  `[foundations, styles]`; only design tokens (CSS custom properties on `:root`)
  cross the boundary, so a component's look can't be perturbed by page CSS.
- **Tokens are the public API.** Renaming a `--color-*` / `--space-*` / selector
  is a breaking change for plugin authors; add freely, rename only with a major bump.
- **`-base` components are UI-only.** No OSC, store, or bind logic — the logical
  `sc-elements` in the host app wrap them to add behaviour.
