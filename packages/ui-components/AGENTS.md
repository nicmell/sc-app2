# Agent Guidance: `packages/ui-components`

## Package Role

This package provides framework-agnostic `sc-base-*` Lit components and CSS foundations.
It must stay UI-only: no OSC, no runtime store, no plugin bind resolution, no app session
logic.

Consumers compile the TypeScript and SCSS source directly through Vite. There is no separate
library build artifact to update.

## Component Rules

- Public tags are `sc-base-*`; classes are `Sc*Base`.
- Components use shadow DOM and `static styles = [resetStyles, styles]`.
- Modifier props that style the host should reflect to attributes.
- Host events must be composed. For form-like widgets, re-emit `input` and/or `change` from
  the host and make `e.target.value` or `e.target.checked` usable by consumers.
- Shared sizes use `sm | md | lg` with `md` as the default.
- Input controls should not grow app-specific variants. Keep state palettes for badge/chip/
  alert/toast/text-style components, as documented in `README.md`.
- Use tokens and SCSS mixins from `src/foundations`; token names are public API.
- Overlay components use native top-layer primitives where already established.

## Exports And Registration

When adding a component, update all relevant package surfaces:

- component folder under `src/components/`
- `src/components/index.ts`
- the `@sc-app/ui-components/lit` export surface
- `README.md` component table
- tests under `src/components/__tests__` when behavior/events matter

The foundation entry (`@sc-app/ui-components`) is CSS side-effect import only. Do not turn
`src/foundations/index.scss` into Lit CSS; consumers intentionally load it as a document
stylesheet.

## Checks

```bash
yarn workspace @sc-app/ui-components typecheck
yarn workspace @sc-app/ui-components test
```

The unit environment is `happy-dom`; it cannot prove top-layer layout or real positioning.
Use a browser check when changing overlays, pointer interactions, or CSS that depends on
layout.
