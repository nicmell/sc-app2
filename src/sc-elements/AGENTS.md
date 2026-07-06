# Agent Guidance: `src/sc-elements`

## Core Rule

The custom element is the runtime object. Do not add a separate parser item layer, copied
attribute structure, nested runtime object, or string `type` field.

`ScElement.process(ctx)` attaches the element to its parent, validates it, resolves runtime
values, assigns those values onto the element, and recurses as needed. Work with that flow.

## Element Contracts

- Declare public attributes as Lit reactive properties on the class.
- Keep validation colocated in `validate()` and use helpers from
  `src/sc-elements/internal/validation.ts`.
- Keep runtime-only fields non-reactive unless they must drive rendering.
- Build runtime results with `baseRuntime(ctx)`, category helpers, and the existing
  `resolveRuntime(ctx)` pattern.
- If an element joins a category, update `src/lib/utils/guards.ts` and relevant type contracts.
- If an element is added or renamed, update the barrel/registry in `src/sc-elements/index.ts`
  and `src/constants/sc-elements.ts`.

## State And Bindings

- Live values are `_state` on `ScDerived`.
- Subscribe with `onStateChange()`; do not invent alternate event seams.
- Literal `sc-control`/`sc-var` values are store-backed and user-writable.
- Bound/derived values are element-to-element and read-only; writes to them should be inert.
- Forward references remain invalid. Bind targets must already be declared in DOM order.
- `sc-if` is visual-only and path-transparent; it must not contain node elements.

## Inputs

Input elements such as `sc-slider`, `sc-knob`, `sc-checkbox`, `sc-switch`, `sc-select`, and
`sc-radio-group` wrap `@sc-app/ui-components` base widgets.

Keep the split clean:

- `packages/ui-components` owns UI, shadow DOM, sizing, disabled state, and host events.
- `ScInput` and concrete `src/sc-elements/inputs/*` classes own bind resolution, `_state`
  sync, write dispatch, snap-back behavior for derived targets, and plugin validation.
- Read base widget values from the composed host event target.
- Use Lit `live()` when the browser or base widget mutates a displayed value directly.

## Tests

For element changes, run at least:

```bash
yarn exec vitest run src/sc-elements
```

For changes that touch parsing, lifecycle, schema-facing attributes, examples, or SynthDef
collection, run the full frontend/package suite:

```bash
yarn test
```

Parser error tests often assert exact messages. Update fixtures and messages deliberately.
