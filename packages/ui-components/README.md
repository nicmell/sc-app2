# `@sc-app/ui-components`

The sc-app design system: a CSS **foundation** (tokens, themes, reset, base
element styles) plus a library of framework-agnostic **`-base` components** (Lit
web components with React wrappers). **Every component is shadow DOM** and styles
itself uniformly: `static styles = [foundations, styles]` — the one shared
`foundations` sheet plus its own Lit `css` (a co-located `sc-x.styles.ts`). No
CSS Modules, no `unsafeCSS`, no per-component magic.

Three consumers:

1. **The React host** (`src/`) — adopts the foundation CSS once in
   `src/main.tsx` (for the light-DOM app shell), registers the web components,
   and uses the React wrappers.
2. **Lit widgets** (`src/sc-elements/*`) — render the `-base` tags directly.
3. **Runtime HTML plugins** (trusted) — register the components and use the
   `-base` tags, inheriting the host's look with no bundle of their own.

## Layout

```
src/
  foundations/             pure CSS — tokens, reset, base element styles
    index.css              entry; @imports tokens + themes + reset + base (NO components)
    tokens/semantic.css    --color-* / --space-* / --radius-* / type / shadow  (PUBLIC API)
    themes/{dark,light}.css  dark = default at :root; light under [data-theme="light"]
    base/{elements,typography}.css   bare button/input/select/textarea/label/headings/code
  components/              the -base Lit web components + their co-located styles
    sc-<tag>/sc-<tag>.ts        the component: `static styles = [foundations, styles]`,
                                renders a shadow tree using literal class names
    sc-<tag>/sc-<tag>.styles.ts the component's own Lit `css` (`export const styles`)
    index.ts               element barrel + registerUiComponents()
    internal/foundation-styles.ts   shell sheet (`foundations`, into shadows) + tokens
                                     layer (ensureTokens, self-bootstrapped onto the document)
    internal/events.ts               relay(): re-emit a composed input/change from the host
    internal/widget-base.styles.ts  shared widget css (sr-only, variant accents, disabled)
    internal/sc-widget-base.ts       abstract base for the graphical widgets
    internal/icon-font.ts            adopts the Phosphor glyph CSS into the icon's shadow
    react.ts               all @lit/react wrappers (one-liners) in a single file
```

### Entry points (package `exports`)

| import | what |
|---|---|
| `@sc-app/ui-components` | the foundation CSS — tokens + themes + reset + base (component styles ship with the components, not here) |
| `@sc-app/ui-components/lit` | the web components + `registerUiComponents()` (each component self-styles via `static styles`) |
| `@sc-app/ui-components/react` | the React wrappers (importing the barrel registers the elements) |
| `@sc-app/ui-components/tokens` `/themes/dark` `/themes/light` `/reset` | individual CSS layers |

## Using the components

```ts
// 1. tokens self-bootstrap: importing/registering any component puts the design
//    tokens on the document automatically, so components render with resolved
//    colors out of the box (no setup). Only call adoptFoundation() if you ALSO
//    want the reset + base element styles on your light-DOM app shell:
import { adoptFoundation } from "@sc-app/ui-components/lit";
adoptFoundation();                 // optional — for the host app's own markup

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
| `sc-icon-base` | `name` `size` `label` | — | Phosphor **fill** glyph (needs the font) |
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
The shared widget css (`.sr-only`, the variant→`--_accent` accents, `.disabled`)
is `internal/widget-base.styles.ts`, included in each widget's `static styles`.
`ScWidgetBase` is abstract — not a tag. The parent↔child contexts live in
`internal/contexts.ts`.

### Styling — one foundation + Lit `css` per component

Each component owns its CSS as a co-located `sc-x.styles.ts` exporting a Lit
`css` template (`export const styles = css\`…\``), and composes it with the one
shared `foundations` sheet:

```ts
import { foundations } from "../internal/foundation-styles";
import { styles } from "./sc-x.styles";
static styles = [foundations, styles];          // adopted into the shadow root
```

`internal/foundation-styles.ts` splits the foundation into two layers:

- **shell** (`shell.css` — reset + bare `input{}`/`button{}`/`details{}`/… element
  styles) is the shared `foundations` sheet adopted into **every** component's
  shadow, so a bare element already looks right there.
- **tokens** (`tokens.css` — design tokens + theme palette) lives on the
  **document**: `:root` doesn't match inside a shadow, but custom properties
  inherit across the boundary, so document tokens resolve in every shadow. The
  module **self-bootstraps** this — importing any component calls
  `ensureTokens(document)` (idempotent, reset-free), so `var(--…)` resolves with
  no consumer setup. `adoptFoundation()` adds both layers to the document for the
  light-DOM app shell.

Class names are literal but **shadow-scoped**, so they never collide across
components and there's no build-time hashing to keep in sync.

Two notes on shadow-DOM styling:

- **Slotted content** (a panel/drawer `<header>`, etc.) is light DOM, so it's
  styled with `::slotted(...)` from the component's own css — the component does
  not expose global classes for consumers to hook.
- **Icon font.** `<sc-icon-base>` renders `<i class="ph-fill ph-<name>">`, but
  the Phosphor `.ph-*` glyph rules live in a *document* stylesheet that can't
  reach a shadow root. `internal/icon-font.ts` snapshots those rules into a
  constructable sheet and `adoptIconFont()`s it into the icon's shadow (lazy +
  cached; a no-op where the font CSS isn't loaded).

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
yarn typecheck      # tsc over the TS components (chained into the root typecheck)
yarn test           # vitest + happy-dom behaviour suite
```

The package is **source-only** — no build step. Consumers import the foundation
CSS (`./src/foundations/index.css`) and the TS components through their own
bundler (the host's Vite resolves the `@import` chain and transpiles the
components).

## Demo

`index.html` renders the foundation + every `-base` component. The widgets need
the TS modules transpiled and decorators lowered, so **serve it through Vite**:

```bash
npx vite            # from packages/ui-components/, then open the printed URL (/)
```

(Opening the file directly still shows the CSS-only foundation sections.)

## Constraints

- **Plain CSS only** in `foundations/` — no Sass/Tailwind/nesting, no build step;
  the host's bundler (Vite) inlines the `@import` chain.
- **Shadow-encapsulated components.** Each component is a shadow root styled by
  `[foundations, styles]`; only design tokens (CSS custom properties on `:root`)
  cross the boundary, so a component's look can't be perturbed by page CSS.
- **Tokens are the public API.** Renaming a `--color-*` / `--space-*` / selector
  is a breaking change for plugin authors; add freely, rename only with a major bump.
- **`-base` components are UI-only.** No OSC, store, or bind logic — the logical
  `sc-elements` in the host app wrap them to add behaviour.
