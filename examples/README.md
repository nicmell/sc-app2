# `examples/` — plugin bundles

Sources live at `examples/plugins/<category>/<name>/` (one plugin each:
`metadata.json` + entry XHTML + optional assets), zipped verbatim into the
gitignored `examples/dist/<name>.zip` (flat) by
`scripts/package-plugins.sh`; `yarn examples:sync` packages AND bulk-imports
them into the dev app root (`plugin add examples/dist` — the `invalid/`
fixtures fail by design and are just logged). They double as the
**acceptance suite** for the parser/runtime:
`node scripts/validate-examples.mjs` (with the dev stack + headless Chrome
running) uploads every one of them and runs the in-page parse-engine
validation — see "Validating example plugins" in the root CLAUDE.md.
Anything failing outside the `invalid/` fixtures is a bug.

Entries are XHTML rooted at `<sc-plugin>`. Display metadata belongs in
`metadata.json`: `title` and `description` are optional string fields. The loader
parses XML and imports the root's children into its runtime host, so self-closing
tags are safe. The root declares `xmlns="http://www.w3.org/1999/xhtml"` and
`xmlns:bind="urn:sc-app:bind"` so dynamic runtime props can use the `bind:` namespace.
To install one by hand:
`cd examples/<cat>/<plugin> && zip -r /tmp/p.zip . && curl -X POST
--data-binary @/tmp/p.zip http://127.0.0.1:3000/api/plugins`.

## `app/` — the stock dashboard

| plugin           | purpose                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-plugin` | The default dashboard (`name: default-dashboard`): the three widgets — `sc-strudel` editor, `sc-scope` master-out oscilloscope, `sc-console` OSC log. Smoke-tests the widget leaves + plugin group lifecycle. |

## `synths/` — synth/synthdef basics

| plugin            | purpose                                                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `example-plugin`  | The kitchen-sink basic: one synthdef + one synth with freq/amp/pan/gate controls, `sc-knob`s + an `sc-slider`, an `sc-checkbox`, an icon-only gate button, and `sc-display`s. Tests controls on a synth + the input/visual binds. |
| `group-plugin`    | Two synths inside an `sc-group` sharing a local synthdef, per-oscillator controls. Tests group nesting + per-synth scopes.                                                                                                        |
| `synthdef-plugin` | FM synthesis: a multi-ugen graph (SinOsc → MulAdd → BinaryOpUGen → Out) with bound ugen inputs, an icon-only gate button, and displays. Tests the ugen input-reference validation and graph compilation.                          |

## `bindings/` — scope & bind resolution

| plugin                 | purpose                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `nested-groups-plugin` | Multi-segment bind paths (`outer.inner.deep.control`) through nested groups — tests `walkPath` + cumulative scopes.                       |
| `group-bind-plugin`    | Group-level controls plus group/per-synth gate buttons, ranges, and displays — tests cross-level binds.                                   |
| `var-plugin`           | `sc-var`s with arithmetic `bind:value` expressions (mirror, `vars.freq * 2`, sums, products) — tests dynamic state expression resolution. |
| `conditional-plugin`   | `sc-if` with `bind:when` expressions binding to siblings — tests that `sc-if` is scope-transparent.                                       |
| `dynamic-props-plugin` | Dynamic widget props (`bind:min`, `bind:max`, `bind:label`) plus string state and ternary `sc-display` expressions.                       |

## `inputs/` — input widgets

| plugin              | purpose                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `button-plugin`     | `sc-button` targeting a synth control with dynamic `bind:icon`/`bind:label` ternaries and a derived state display. |
| `select-plugin`     | `sc-select`/`sc-option` dropdowns and `sc-radio-group`/`sc-radio` sets bound to controls/vars.                     |
| `waveselect-plugin` | A `Select` UGen switching SinOsc/Saw/Pulse, driven by an `sc-select` — an input wired into a synth graph.          |

Input widgets bind their editable value with `bind:value`. Synth instances
reference their definition explicitly with `synthdef`. An `sc-button`
fixed-value payload uses `set`, with runtime-capable `bind:set`.

## `widgets/` — the widget leaves' parameters

| plugin                  | purpose                                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scope-frames-plugin`   | A simple sine synth (freq/amp/gate) feeding four `sc-scope`s with `frames` 1024/2048/4096/8192 — the same signal at four window sizes (and four refresh rates: bigger windows page rather than flow). Tests per-(channels, frames) tap compilation + concurrent slots.                               |
| `scope-channels-plugin` | A two-channel synthdef (sine left, saw right — `Out` with a comma-list `channelsarray`) under three scopes: one 2-channel tap over bus 0–1 plus per-channel mono taps. Tests multichannel lane separation (the chunk's planar layout — this example caught the renderer indexing it as interleaved). |
| `keyboard-plugin`       | A `sc-keyboard` over a self-freeing `sineNote` synthdef: the ADSR is a flat `Env.asArray` LITERAL on EnvGen's variadic `envelope` input; each pressed key spawns a voice (`freq` = note.midicps, `amp` = velocity), key-up gates the release + doneAction 2 frees the node. Play by click, the `a…k` row, or MIDI hardware. |
| `env-scope-plugin`      | The envelope VERIFICATION rig: one array control drives (a) a retriggered `EnvGen.ar` written to a private bus and displayed by `sc-scope` — the trace must MATCH the editor's curve, live per drag — and (b) a laser-zap keyboard voice whose PITCH is the envelope (`bind:value="e * 1800 + freq - 200"`), so shape edits are unmistakable by ear. Also exercises Impulse/Trig1 retriggering + expressions over env output.  |
| `adsr-panel-plugin`     | BIDIRECTIONAL ADSR panel: the envelope array is THE state — the editor writes it whole (structure LOCKED via `minbreakpoints`/`maxbreakpoints`, positions draggable), the knobs are SLOT LENSES (`bind:value="env.5"` reads one element, writes a fresh copy through the slot). Turn a knob → the curve moves; drag a breakpoint → the knobs follow; new voices latch the current shape. Tests numeric-tail slot binds + the breakpoint-count locks.  |
| `mod-env-plugin`        | SERVER-side modulatable envelope: `perc(att, rel)` on EnvGen's variadic `envelope` input wires the def PARAMS into the envelope's time slots — knobs `/n_set` the PLAYING node and scsynth recomputes the shape (watch it morph on the unipolar scope). An `sc-button` gates the retrigger on/off (`tick * on`). Tests call lowering with modulatable refs.  |
| `env-editor-plugin`     | The LIVE envelope through the GENERIC array plane: a plugin-level ARRAY `sc-control` (Env.asArray encoding), a synthdef declaring the same array as a control-array param read by `bind:value="env"` on EnvGen's `envelope`, and `<sc-envelope bind:value="env"/>` — one group `/n_setn` per edit fans to every keyboard voice. Edits survive reloads.  |
| `strudel-var-plugin`    | A Strudel editor two-way-bound to a root-level string `sc-var`: the display mirrors editor keystrokes, external var writes drive the editor, and the seed demonstrates the attribute-safe `\\n` newline escape. |

## `invalid/` — intentional failures (the negative fixtures)

Upload-time fixtures (rejected by the backend zip/spec validation):

| plugin                 | fails with                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| `bad-metadata`         | `"author" must be a non-empty string`                               |
| `bad-entry-xhtml`      | ill-formed XML                                                      |
| `bad-entry-schema`     | spec gate (sc-validate): `<script>` is not sc-plugin content        |
| `bad-asset-type`       | `svg` is not a supported asset type                                 |
| `bad-asset-mismatch`   | asset content (jpeg) ≠ declared type (png)                          |
| `bad-name-syntax`      | spec gate (sc-validate): a dotted `name` fails the identifier grammar |
| `bad-runtime-conflict` | spec gate (sc-validate): static `value` + `bind:value` are exclusive  |
| `bad-attr-multierror`  | spec gate: EVERY attribute rule violated once (required, decimal/integer/boolean/enum lexical, the three range facets on one element, numeric vector, unknown attr, foreign prefix, `bind:` on an opted-out attr) — 12 violations reported together, one per line |
| `bad-content-multierror` | spec gate: every content rule — strict-empty leaves (child + text), `<ul>` without an `<li>`, and a child-only `sc-option` escaping its `sc-select` |
| `bad-namespace`        | spec gate: elements outside the XHTML namespace (a root missing `xmlns`) — one violation per element |

Runtime fixtures (upload fine; the parse engine must reject them — each one
targets a single error path in the sc-elements runtime
(`internal/engine/validation.ts` + the `resolveRuntime` overrides)):

| plugin                   | error path                                | fails with                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bad-bindings`           | `checkDuplicateNames`                     | duplicate `sine` name in scope (the grab-bag fixture also carries unknown-node and undeclared-control binds behind the first error)                                                                                                                                                                          |
| `bad-node-bind`          | `resolveStatePath`                        | `bind:value="ghost.freq"` — no node `ghost` in scope                                                                                                                                                                                                                                                         |
| `bad-synthdef-bind`      | `resolveStatePath`                        | `bind:value="sine.freq"` resolves to the _synthdef_ (not a node) — the classic param-vs-control mistake                                                                                                                                                                                                      |
| `bad-undeclared-control` | `resolveStatePath`                        | `bind:value="s1.detune"` — `s1` declares no `detune` control                                                                                                                                                                                                                                                 |
| `bad-circular-bind`      | `resolveStatePath` (self-reference guard) | an `sc-var bind:value="vars.a"` self-reference — the only cycle expressible now that references point strictly backward                                                                                                                                                                                      |
| `bad-forward-ref`        | `resolveNode`                             | controls/inputs reference a synth declared _after_ them — bind targets must be declared before their references in DOM order                                                                                                                                                                                 |
| `bad-forward-state-ref`  | `resolveStatePath`                        | a same-scope state `bind:value="vars.b"` before `b` is declared — the honest bind-order error, not "not declared"                                                                                                                                                                                            |
| `bad-synth-target`       | `sc-synth resolveRuntime`                 | `<sc-synth synthdef="fx">` naming a _group_ — the reference must resolve to an actual `<sc-synthdef>`                                                                                                                                                                                                        |
| `bad-unknown-synthdef`   | `sc-synth resolveRuntime`                 | `<sc-synth synthdef="missing">` matches no `<sc-synthdef>`                                                                                                                                                                                                                                                   |
| `bad-ugen-input`         | `sc-synthdef collectUgenInputs`           | a ugen `sc-control` with neither `bind` nor `value`                                                                                                                                                                                                                                                          |
| `bad-ugen-ref`           | `sc-ugen resolveRuntime`                  | a ugen input bound to `lfo`, which names no sibling ugen / param                                                                                                                                                                                                                                             |
| `bad-if-shadow`          | `checkDuplicateNames`                     | a same-named var inside a TRANSPARENT `sc-if` — its contents parse into the enclosing sibling scope, so the collision fails the flat-scope duplicate check                                                                                                                                                 |
| `bad-param-bind`         | `sc-synthdef resolveRuntime`              | `bind:value` is not allowed on a direct synthdef param `sc-control`; graph inputs inside `sc-ugen` use `bind:value` or `value`                                                                                                                                                                               |

(The `spec gate` rows are STATIC fixtures: the sc-validate crate rejects
them at upload (400 with the structured ApiError envelope — code
`plugin-spec-violations` + the typed violations array) AND at frontend
`parseEntry` — the unit suite (`examples.test.ts`) is the ONE owner of their
exact, possibly multi-line, messages; native and wasm share the crate, so
those pins cover both builds.)

Not yet ported from the old app (buffer-family migration step):
`scope-plugin`, `waveform-plugin`, `test-plugin`.
