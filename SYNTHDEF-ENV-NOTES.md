# SynthDef / envelope work — branch notes

Annotates the feature line on the stacked branches `feat/sc-keyboard` →
`feat/sc-env` → `feat/sc-env-shapes` → `feat/env-editor`. Merge oldest-first.

## FINAL ARCHITECTURE (after three design iterations, user-driven)

**The envelope is not an engine concept.** There are NO envelope elements:
`sc-env` and `sc-segment` (built in earlier iterations) were deleted. Instead
the general value plane gained ARRAYS + SC's multichannel expansion:

1. **Array values** — `sc-control`/`sc-var` `value` is a VECTOR: a scalar, or
   a comma-list of numerics → `number[]` (`StateValue = number | string |
   number[]`; arrays immutable per edit). A synthdef param with an array
   value compiles as a CONTROL ARRAY (`SynthDef.addControlArray`: N slots,
   one name entry at the base — sclang's `\name.kr([...])`). Instance/level
   controls: arrays are excluded from /s_new pairs and seeded post-/n_go
   with `/n_setn` (`ScNode.getArrayControls` + ScSynth.load); a write
   dispatches `/n_set` (scalar) or `/n_setn` (array) on the owning node —
   GROUP-level array writes fan to every voice (the live shared envelope
   with zero special machinery).
2. **Full multichannel expansion** — in BOTH backends. UI `evalExpr`:
   element-wise with the shorter operand cycling (wrap), unary maps,
   comparisons → 1/0 arrays, array ternary cond selects element-wise. Graph
   (`compileSynthDef`): `Signal = UGenInput | UGenInput[]`; an array on a
   scalar ugen input DUPLICATES the ugen max(len) times (wrapAt per input)
   and the name resolves to the instance array downstream (`name.idx` maps
   per instance); expressions lower element-wise through op nodes; VARIADIC
   inputs — `channelsArray`, `inputArray`, and now `envelope` — flatten
   their signal into the tail (SC's own rule).
3. **`<sc-env-editor>`** — the sole envelope-aware piece: an input over an
   ordinary array-valued control/var. `lib/synthdef/envValue.ts` is the
   codec (flat `Env.asArray` run ⇄ breakpoints; garbage-tolerant decode;
   encode zero-pads to the bound array's width — the segment budget is
   `(len-4)/4`). Drag/insert/remove/curve gestures encode fresh arrays
   through the generic commit → store + `/n_setn`.
4. Envelope AUTHORING is a raw flat array literal (see keyboard-plugin) or
   the editor. The package keeps `encodeEnv` (the codec uses it) and the
   env-shape registry (`env-registry.ts`, currently app-unused — future
   editor presets).

Examples: `widgets/keyboard-plugin` (literal-array ADSR),
`widgets/env-editor-plugin` (live array control + editor + keyboard).
`synths/envelope-plugin` (segments demo) deleted with the elements.

Known limits: keyboard voices spawned after an edit start from the def's
declared defaults until the next group write reaches them; sc-display shows
arrays as comma-lists; MCE arrays are flat (no nesting).

## Iteration history (what was built and replaced)

1. `feat/sc-keyboard` — the piano widget (unchanged, survives).
2. `feat/sc-env` — baked `<sc-env>` (registry shapes → constants in the def).
3. `feat/sc-env-shapes` — `<sc-segment>` structured breakpoints + shape
   registry + modulation; PLUS expression→graph lowering (#1 of the old
   roadmap — survives, now generalized by MCE).
4. `feat/env-editor` — iteration B: shared control-bus envelopes (Rust span,
   In.kr, /c_setn) — REPLACED by iteration A: per-synth control arrays with
   a special live-state channel — REPLACED by the final generic design
   above. The branch history keeps all three; squash-merge for a clean diff.

## Still-open roadmap (from the expressivity review)

- Registry-driven variadic-input flags (replace the hardcoded ARRAY_INPUTS).
- Rate inference for AUTHORED ugens (op nodes already infer).
- `pow`/`%` in the expression grammar; ternary→Select in the graph.
- Presets (roadmap 8) — array values are JSON-ready.
