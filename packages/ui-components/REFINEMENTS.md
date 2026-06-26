# UI Components — Refinement Backlog & Session Notes

Handoff doc for the next session. The library (`@sc-app/ui-components`) is essentially
landed on branch `ui-components-base-widgets`: stylesheets are SCSS, components are
`.root`-free where sensible, a shared mixin library exists, and the field family +
cross-component states have been unified. What remains is **design refinement, not new
architecture** — mostly accessibility and interaction polish.

Read the **Gotchas** section before touching anything; several non-obvious facts will
bite otherwise.

---

## Refinement backlog (recommended, prioritized)

Each item: _what / where / why / suggested fix_. Tier 1 are effectively bugs.

### Tier 1 — Accessibility (do these)

- [ ] **1. Field focus is a weak/inaccessible indicator.**
  - _Where:_ `field-focus` mixin in `src/foundations/_mixins.scss` (used by the native
    `input/select/textarea` rule in `base/controls.scss` and by sc-select's combobox).
  - _Why:_ it does `outline: none; border-color: var(--color-border-focus)` — a 1px
    colour shift. Fails WCAG 2.4.13 (Focus Appearance) and is inconsistent with the 2px
    ring every other control gets (checkbox/radio/switch/button/knob/slider via
    `focus-ring`).
  - _Fix:_ give fields a real ring — keep the border recolour if you like, but add a
    visible outline/box-shadow ring (~2px, `--color-border-focus`). Consider folding into
    `focus-ring` so there is **one** focus affordance across the library.

- [ ] **2. No global `prefers-reduced-motion`.**
  - _Where:_ only `sc-progress` and `sc-drawer` honour it today; ~11 components animate
    (switch thumb slide, checkbox check scale, button/field transitions, toast, popover).
  - _Fix:_ one foundation rule, not per-component. Add to a foundation sheet (e.g.
    `foundations/shadow.scss` so shadow roots get it, and `base/elements.scss` for the
    head/light-DOM):
    `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; } }`

- [ ] **3. Interactive target sizes below WCAG 2.5.8 (24×24 CSS px).**
  - _Where:_ standalone checkbox box = 14/16/20px (sm/md/lg via `--_box`), radio `--_r`
    same, slider thumb 12.8–20px (`--_thumb`).
  - _Fix:_ keep the painted control small but enlarge the **hit area** to ≥24px — a
    transparent `::before` overlay or `min-block-size/min-inline-size` on the `label`.
    Don't just scale the visual up.

### Tier 2 — Interaction polish (expected of a pro library)

- [ ] **4. `sc-option` has no `:hover`.** (Do this one first in this tier.)
  - _Why:_ a dropdown where you can't see the row you're about to click. Clear UX miss.
  - _Fix:_ hover background on the option row; `--color-surface-3-hover` already exists.

- [ ] **5. checkbox / radio / switch have no hover affordance** (focus only). Add a
  subtle border-brighten on `:host(:hover:not([disabled]))` or the `.box/.ring/.track`.

- [ ] **6. Buttons have no `:active` (press) state.** Hover + focus only. Add a small
  press affordance (darken / 1px inset) on `button:active:not(:disabled)`.

### Tier 3 — Robustness (can defer)

- [ ] **7. No `forced-colors` (Windows High-Contrast) support.** Custom-painted controls
  (checkbox box, switch track, radio ring) are CSS bg/border and can disappear in
  forced-colors mode. Add a `@media (forced-colors: active)` pass using system colours
  (`CanvasText`, `Highlight`, etc.).

- [ ] **8. Verify the dim text tokens.** `--color-text-faint` (#5a5e68) on `surface-1`
  is ~2.5:1 — below AA (4.5:1) and the 3:1 UI threshold. Fine if decorative only;
  a failure if it carries readable text. Confirm usage; bump if needed.

---

## Gotchas (read before editing — these are load-bearing)

### Verification

- **The render gate is the ONLY styling check.** `vite-plugin-lit-css` returns *empty*
  CSS under vitest/happy-dom, so unit tests never see computed styles. To verify any
  visual change: run `yarn demo` (dev server on `:5173`) + headless Chrome
  (`--remote-debugging-port=9222`), then drive it over CDP `Runtime.evaluate`
  (`awaitPromise: true`), mount the element, and read `getComputedStyle`. See the
  `probe-*.mjs` scripts written this session (in the scratchpad) for the exact pattern.
- **`:focus-visible` can't be triggered synthetically** (needs real keyboard input).
  Verify focus rules by reading the compiled rule text instead: walk
  `el.shadowRoot.adoptedStyleSheets[*].cssRules` and assert the declaration is present.
- **A DRY refactor must preserve computed output.** Declaration *reordering* is fine when
  the properties don't conflict (e.g. `font: inherit` must still precede `font-family`),
  but never change a value silently. Re-run the render gate and diff computed styles.

### SCSS pipeline

- **`sass` IS required** as a dependency — `vite-plugin-lit-css` does not compile SCSS
  itself; it relies on Vite's Sass step running first. (An earlier note claiming "Sass
  isn't required" was wrong.)
- **`foundations/_mixins.scss` is a pure-mixin partial** — no top-level rules, so
  `@use`-ing it emits zero CSS until something `@include`s. Safe to pull into every sheet.
- **`@use` must come before all style rules** (after the top comment is fine). Paths:
  from a component, `@use "../../foundations/mixins" as *;`; from `foundations/base/*`,
  `@use "../mixins" as *;`.
- **litCss globs** (in `vite.config.ts`, `example/vite.config.ts`, `vitest.config.ts`):
  include `**/ui-components/src/**/*.scss`, exclude `foundations/index.scss` (the head
  foundation, loaded as a normal stylesheet, not a Lit `CSSResult`). Partials and files
  only reached via `@use` are inlined by Sass and never hit litCss directly.

### Shared mixins & the field family

- Mixins live in `foundations/_mixins.scss`: `focus-ring($offset)`, `disabled($block)`,
  `overlay-surface($radius)`, `visually-hidden`, and the field set `field-surface`,
  `field-focus`, `field-size($target)`.
- **The text fields (input/textarea/inputnumber/select) are one family** sharing
  `field-surface` + `field-focus` + `field-size`. The **one deliberate per-field knob is
  `border-radius`** (all `radius-xs` now). The combobox is a `<button>`, so it can't
  inherit `controls.scss`'s field rule — it pulls the same mixins explicitly.
- **`:host([size])` is intentionally NOT mixin-ized for the graphical widgets**
  (checkbox/switch/radio/slider/knob) — each sizes different custom props
  (`--_box`/`--_w`/`--_len`/…), so a shared size mixin would cost more than it saves.
  Only the text fields share `field-size`. Don't "unify" the widget size scales.
- `disabled($block: true)` → `opacity .5; pointer-events: none` (host widgets);
  `$block: false` → `opacity .5; cursor: not-allowed` (native button/select). All
  disabled states are `0.5` now (sc-panel was the lone `0.55`, fixed).

### sc-popover & sc-select

- **The Popover API is assumed** (Baseline 2024) — there is no fallback. `sc-popover`
  uses `popover="auto"` + `showPopover()`/`hidePopover()`; the native `toggle` is the
  source of truth for `open`.
- **Positioning is `src/components/internal/position.ts`** (vanilla; floating-ui was
  removed). It is **scoped, not a general floating-ui replacement**: 12 placements,
  single-step flip, cross-axis shift, scroll/resize/ResizeObserver tracking. Out of
  scope (documented in the file): fallback-placement lists, anchors that move without
  scroll/resize (CSS animation), RTL, nested transformed scrollers, arrows. Re-add
  floating-ui if any of those become real — it's isolated behind this one file.
- **happy-dom quirks behind the positioning design:** happy-dom reports Popover API
  support but does **not** fire the `toggle` event, and floating-ui/`getComputedStyle`
  *crash* in happy-dom. Positioning therefore runs from the native `toggle` (real browser
  only) — that's why it's wired that way, not eagerly in `#show()`. Don't "simplify" it
  back to eager positioning or unit tests will crash.
- **sc-select nests `<sc-popover-base>`** as its dropdown (it does not use a positioning
  controller — that class was inlined into sc-popover and deleted). It styles the panel
  via `sc-popover-base::part(panel)`; the combobox↔listbox link is `aria-controls` (not
  the native `popovertarget`, which can't cross the popover's shadow boundary). A
  **`pointerdown` guard** on the combobox reproduces the invoker-exemption that
  `popovertarget` gives for free (else clicking the trigger while open light-dismisses
  then immediately reopens). Don't remove it.

### sc-text

- Polymorphic via `as` (`span`|`p`|`div`|`h1`–`h6`), rendered with `lit/static-html`'s
  `literal` from a **fixed lookup table** — never interpolate the raw `as` value
  (`unsafeStatic` on a prop is an injection vector).
- The tag is **semantic only**; look is prop-driven. A zero-specificity `:where(tag-list)`
  base reset drops the UA heading scale so the modifier rules win. **Display follows the
  tag** (span inline, others block); `inline` forces inline; `truncate` forces `block`
  (ellipsis needs a block box).
- Like the rest of the library, the modifier props (`size`/`weight`/`tone`/`font`/`align`/
  `truncate`/`inline`) **reflect to the host**; styling hooks off `:host([attr]) > *` (the
  rendered tag is the host's single shadow child). `as` is NOT reflected — it's a
  structural input read in `render()` to pick the tag, not a `:host` style hook. No `cx`.

### Misc

- **Registration is centralized** in `src/components/index.ts` → `registerUiComponents()`
  (idempotent `customElements.define`). Per-file `import "../sc-x/sc-x"` side-effect
  imports are documentation/dependency hints, not the registration mechanism.
- Commit messages in this repo end with the `Co-Authored-By` trailer; keep that.
