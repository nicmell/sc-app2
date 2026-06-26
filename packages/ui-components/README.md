# @sc-app/ui-components

Framework-agnostic **`-base` UI components** — [Lit](https://lit.dev) shadow-DOM web
components (with React wrappers) — plus the CSS **foundation** (design tokens, reset, bare
element styles, the [Phosphor](https://phosphoricons.com) icon font) they share. Consumed by
the React host and trusted runtime HTML plugins. **No build step**: the `exports` point at
the TS + `.scss` source and each consumer's Vite compiles it via `vite-plugin-lit-css`.

## Install

Workspace-local — referenced via `"@sc-app/ui-components": "workspace:*"`.

## Usage

```ts
// 1. Foundation, once at boot — a side-effect import; Vite lifts it to a render-blocking
//    <head> <link> (styled first paint, registers the icon font document-wide).
import "@sc-app/ui-components";

// 2a. As web components (Lit / plugin HTML)
import { registerUiComponents } from "@sc-app/ui-components/lit";
registerUiComponents();                    // idempotent; defines every <sc-*-base> tag
// <sc-button-base label="Run" variant="danger"></sc-button-base>

// 2b. As React components
import { ScButton } from "@sc-app/ui-components/react";
// <ScButton label="Run" variant="danger" onClick={…} />
```

**Events are composed, read off the host.** Form widgets re-emit `input`/`change` (containers
fire `change`) from the host — read `e.target.value` / `.checked`; the React wrappers expose
`onChange`/`onInput`. Components are shadow DOM and don't participate in `<form>` submission.

## Entry points (package `exports`)

| import | what |
|---|---|
| `@sc-app/ui-components` | the foundation CSS (a `<head>` stylesheet) |
| `@sc-app/ui-components/lit` | the components + `registerUiComponents()` |
| `@sc-app/ui-components/react` | the React wrappers |
| `/tokens` · `/themes/dark` · `/themes/light` · `/reset` | individual CSS layers |

## Components

Tag `sc-<name>-base` ↔ class `Sc<Name>Base` ↔ React `Sc<Name>`. `size` is `sm | md | lg`
(md default) wherever it appears.

| component | key props | event | notes |
|---|---|---|---|
| `sc-checkbox-base` | `checked` `label` `size` `disabled` | `change` | hidden native checkbox + box |
| `sc-switch-base` | `checked` `size` `disabled` | `change` | hidden checkbox (`role=switch`) + track |
| `sc-knob-base` | `value` `min` `max` `step` `label` `size` `disabled` | `input`/`change` | hidden range + SVG dial; drag/wheel |
| `sc-slider-base` | `value` `min` `max` `step` `orientation` `label` `size` `disabled` | `input`/`change` | hidden range + track/thumb; drag/wheel |
| `sc-radio-base` | `value` `label` `checked` `size` `disabled` | — | child of radio-group (context) |
| `sc-radio-group-base` | `value` `orientation` `label` `size` `disabled` | `change` | context provider; `role=radiogroup` |
| `sc-option-base` | `value` `label` `size` `disabled` | — | child of select (context) |
| `sc-select-base` | `value` `placeholder` `size` `disabled` | `change` | combobox + top-layer dropdown |
| `sc-input-base` | `value` `placeholder` `type` `size` `disabled` | `input`/`change` | native `<input>` |
| `sc-inputnumber-base` | `value` `min` `max` `step` `size` `disabled` | `input`/`change` | hidden spinners, themed steppers |
| `sc-textarea-base` | `value` `placeholder` `rows` `size` `disabled` | `input`/`change` | multi-line |
| `sc-text-base` | `as` `size` `weight` `tone` `font` `align` `truncate` `inline` | — | typography; `as` = `span`/`p`/`div`/`h1`–`h6` |
| `sc-button-base` | `label` `icon` `trailingIcon` `iconOnly` `variant` `size` `disabled` `type` | `click` | composes `sc-icon-base` |
| `sc-icon-base` | `name` `variant` `size` `label` | — | Phosphor glyph |
| `sc-badge-base` | `label` `variant` | — | uppercase pill |
| `sc-chip-base` | `label` `variant` `dot` | — | status chip (optional dot) |
| `sc-alert-base` | `variant` | — | inline notice card; renders children |
| `sc-toast-base` | `message` `variant` | `dismiss` | lives in a top-layer stack |
| `sc-progress-base` | `variant` `value` `max` `size` `label` | — | bar/spinner; `role=progressbar` |
| `sc-panel-base` | `disabled` | — | surface card; child `<header>` = title bar |
| `sc-empty-base` | — | — | "nothing here" placeholder |
| `sc-stack-base` / `sc-cluster-base` | `gap` | — | vertical / horizontal flex |
| `sc-disclosure-base` | `open` | `toggle` | collapsible over native `<details>` |
| `sc-popover-base` | `open` `placement` `anchor` | `toggle` | top-layer anchored panel |
| `sc-modal-base` | `open` `dismissable` `label` | `close` | centred modal over native `<dialog>` |
| `sc-drawer-base` | `open` `side` `dismissable` `label` | `close` | edge slide-in over native `<dialog>` |

**Variants are intentionally different per component:** input controls have **none** (single
accent — `size`/`disabled`/`name` via `ScControlBase`); `sc-button` `primary`(d)/`secondary`/
`ghost`/`danger`; `sc-icon` weight `regular`(d)/`fill`/`duotone`; `sc-progress` shape
`bar`(d)/`spinner`; badge/chip/alert/toast/`sc-text`-`tone` carry state palettes. `gap`
(stack/cluster) is `xs`(d)/`sm`/`md`/`lg` → `--space-*`.

## Design notes

- **Shadow DOM + reflected attributes.** Each component is a shadow root styled by
  `static styles = [resetStyles, styles]` (its own `sc-x.scss` + the shared font-free shadow
  base `foundations/reset.scss`). Modifier props are `@property({ reflect: true })`, so the
  **public attribute is the style hook** — styling keys off `:host([attr])` and the bare root
  element, not a wrapper class. Design tokens reach shadow roots via `:root` custom-property
  inheritance; the icon font is registered document-wide by the head `<link>`. Shared SCSS
  mixins live in `foundations/_mixins.scss`.
- **Overlays use the browser top layer** (escaping clip/transform/z-index). `sc-popover`
  opts its panel into the **Popover API** (`popover="auto"` → native light-dismiss) and
  positions it with the internal vanilla helper `sc-popover/position.ts` (placement + flip +
  shift, no `floating-ui` dependency); `sc-select` nests one. `sc-modal`/`sc-drawer` use a
  native `<dialog>` (`showModal()` → top layer + backdrop + focus trap). Requires the Popover
  API (Baseline 2024).
- **Tokens are the public API** — renaming a `--color-*` / `--space-*` is a breaking change;
  add freely. The colour palette lives in `tokens/themes/{dark,light}.scss` (dark is the
  `:root` default; light under `[data-theme="light"]`, currently a placeholder).
- **`-base` components are UI-only** — no OSC / store / bind logic; the host app's logical
  `sc-elements` wrap them to add behaviour.

## Build

```bash
yarn typecheck   # tsc over the components
yarn test        # vitest + happy-dom — structure / state / events
yarn demo        # standalone Vite showcase (example/), HMR
```

There is **no build step** — consumers compile the source. A consumer wiring
`vite-plugin-lit-css` **must exclude** the foundation entry so it stays a plain `<head>`
stylesheet (otherwise the 1 MB of fonts lands in the JS bundle and the FOUC-fix `<link>`
never happens):

```ts
litCss({
  include: ["**/ui-components/src/**/*.scss"],
  exclude: ["**/ui-components/src/foundations/index.scss"],
})
```

> happy-dom has no top layer or layout, so open/close/positioning + computed styles are
> verified in a real browser via the CDP harness; unit tests cover structure + state + events.
