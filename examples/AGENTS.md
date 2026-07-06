# Agent Guidance: `examples`

## Purpose

These plugin fixtures are tests, not demos only. They exercise:

- frontend parser/runtime behavior in `src/sc-elements/__tests__/examples.test.ts`
- SynthDef collection and compilation
- backend upload validation and XSD validation through `scripts/validate-examples.mjs`

Keep examples small and intentional. A fixture should make one behavior obvious.

## Editing Rules

- Use current element names and attributes. On this branch, use `sc-slider`, not `sc-range`.
- Functional examples should parse cleanly and compile any collected SynthDefs.
- `examples/invalid/bad-*` fixtures must fail for the intended reason. If the expected error
  changes, update the exact assertion in the tests.
- Upload-only invalid fixtures (`bad-metadata`, `bad-entry-xhtml`, `bad-entry-schema`,
  `bad-asset-type`, `bad-asset-mismatch`) are backend validation fixtures and are excluded
  from the frontend parse suite.
- Keep plugin entry files XHTML-compatible enough for the backend validator.
- If a fixture uses a new asset, update its `metadata.json` and keep asset type constraints in
  mind.

## Checks

```bash
yarn exec vitest run src/sc-elements/__tests__/examples.test.ts
```

For schema/upload changes, run the real-stack harness when feasible:

```bash
node scripts/validate-examples.mjs
```
