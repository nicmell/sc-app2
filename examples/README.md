# `examples/` — plugin bundles

Each directory is one plugin (its `metadata.json` + entry XHTML + optional
assets), zipped verbatim for upload. They double as the **acceptance suite**
for the parser/runtime: `node scripts/validate-examples.mjs` (with the dev
stack + headless Chrome running) uploads every one of them and runs the
in-page parse-engine validation — see "Validating example plugins" in the
root CLAUDE.md. Anything failing outside the `invalid/` fixtures is a bug.

Entries are XHTML (self-closing tags are fine — the loader parses XML and
adopts nodes; no HTML re-parse). The `<html>` root declares both
`xmlns="http://www.w3.org/1999/xhtml"` and
`xmlns:bind="urn:sc-app:bind"` so dynamic runtime props can use the `bind:`
namespace. To install one by hand:
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
| `env-editor-plugin`     | The LIVE envelope through the GENERIC array plane: a plugin-level ARRAY `sc-control` (Env.asArray encoding), a synthdef declaring the same array as a control-array param read by `bind:value="env"` on EnvGen's `envelope`, and `<sc-env-editor bind:value="env"/>` — one group `/n_setn` per edit fans to every keyboard voice. Edits survive reloads.  |

## `invalid/` — intentional failures (the negative fixtures)

Upload-time fixtures (rejected by the backend zip/XSD validation):

| plugin               | fails with                                 |
| -------------------- | ------------------------------------------ |
| `bad-metadata`       | `"author" must be a non-empty string`      |
| `bad-entry-xhtml`    | ill-formed XML                             |
| `bad-entry-schema`   | entry doesn't conform to the XSD           |
| `bad-asset-type`     | `svg` is not a supported asset type        |
| `bad-asset-mismatch` | asset content (jpeg) ≠ declared type (png) |

Runtime fixtures (upload fine; the parse engine must reject them — each one
targets a single error path in the sc-elements runtime
(`internal/validation.ts` + the `resolveRuntime` overrides)):

| plugin                   | error path                                | fails with                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bad-bindings`           | `checkDuplicateNames`                     | duplicate `sine` name in scope (the grab-bag fixture also carries unknown-node and undeclared-control binds behind the first error)                                                                                                                                                                          |
| `bad-node-bind`          | `resolveControlBind`                      | `bind:value="ghost.freq"` — no node `ghost` in scope                                                                                                                                                                                                                                                         |
| `bad-synthdef-bind`      | `resolveControlBind`                      | `bind:value="sine.freq"` resolves to the _synthdef_ (not a node) — the classic param-vs-control mistake                                                                                                                                                                                                      |
| `bad-undeclared-control` | `resolveControlBind`                      | `bind:value="s1.detune"` — `s1` declares no `detune` control                                                                                                                                                                                                                                                 |
| `bad-circular-bind`      | `resolveStateBind` (self-reference guard) | an `sc-var bind:value="vars.a"` self-reference — the only cycle expressible now that references point strictly backward                                                                                                                                                                                      |
| `bad-forward-ref`        | `resolveNode`                             | controls/inputs reference a synth declared _after_ them — bind targets must be declared before their references in DOM order                                                                                                                                                                                 |
| `bad-forward-state-ref`  | `resolveControlBind`                      | a same-scope state `bind:value="vars.b"` before `b` is declared — the honest bind-order error, not "not declared"                                                                                                                                                                                            |
| `bad-synth-target`       | `sc-synth resolveRuntime`                 | `<sc-synth synthdef="fx">` naming a _group_ — the reference must resolve to an actual `<sc-synthdef>`                                                                                                                                                                                                        |
| `bad-unknown-synthdef`   | `sc-synth resolveRuntime`                 | `<sc-synth synthdef="missing">` matches no `<sc-synthdef>`                                                                                                                                                                                                                                                   |
| `bad-ugen-input`         | `sc-synthdef collectUgenInputs`           | a ugen `sc-control` with neither `bind` nor `value`                                                                                                                                                                                                                                                          |
| `bad-ugen-ref`           | `sc-ugen resolveRuntime`                  | a ugen input bound to `lfo`, which names no sibling ugen / param                                                                                                                                                                                                                                             |
| `bad-if-shadow`          | `checkDuplicateNames`                     | a same-named var inside a TRANSPARENT `sc-if` — its contents hydrate into the enclosing sibling scope, so the collision fails the flat-scope duplicate check                                                                                                                                                 |
| `bad-name-syntax`        | `requireName`                             | a dotted `name` (`s1.freq`) — dots are the path separator, so the name would FORGE synth `s1`'s `freq` store key (silent cross-wiring no per-scope check can see); names must be one bind-path segment (the XSD's `scName` pattern is best-effort — fastxml ignores pattern facets, the runtime is the gate) |
| `bad-runtime-conflict`   | `validateProps`                           | static `value` and dynamic `bind:value` on the same `sc-var` are mutually exclusive                                                                                                                                                                                                                          |
| `bad-param-bind`         | `resolveRuntimeProps`                     | `bind:value` is not allowed on a direct synthdef param `sc-control`; graph inputs inside `sc-ugen` use `bind:value` or `value`                                                                                                                                                                               |

Not yet ported from the old app (buffer-family migration step):
`scope-plugin`, `waveform-plugin`, `test-plugin`.
