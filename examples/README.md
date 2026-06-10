# `examples/` — plugin bundles

Each directory is one plugin (its `metadata.json` + entry XHTML + optional
assets), zipped verbatim for upload. They double as the **acceptance suite**
for the parser/runtime: `node scripts/validate-examples.mjs` (with the dev
stack + headless Chrome running) uploads every one of them and runs the
in-page `processHtml` validation — see "Validating example plugins" in the
root CLAUDE.md. Anything failing outside the `invalid/` fixtures is a bug.

Entries are XHTML (self-closing tags are fine — the loader parses XML and
adopts nodes; no HTML re-parse). To install one by hand:
`cd examples/<cat>/<plugin> && zip -r /tmp/p.zip . && curl -X POST
--data-binary @/tmp/p.zip http://127.0.0.1:3000/api/plugins`.

## `app/` — the stock dashboard

| plugin | purpose |
|---|---|
| `default-plugin` | The default dashboard (`name: default-dashboard`): the three widgets — `sc-strudel` editor, `sc-scope` master-out oscilloscope, `sc-console` OSC log. Smoke-tests the widget leaves + plugin group lifecycle. |

## `synths/` — synth/synthdef basics

| plugin | purpose |
|---|---|
| `example-plugin` | The kitchen-sink basic: one synthdef + one synth with freq/amp/pan/mute controls, knob + slider `sc-range`s, an `sc-checkbox`, and `sc-display`s. Tests controls on a synth + the input/visual binds. |
| `group-plugin` | Two synths inside an `sc-group` sharing a local synthdef, per-oscillator controls. Tests group nesting + per-synth scopes. |
| `synthdef-plugin` | FM synthesis: a multi-ugen graph (SinOsc → MulAdd → BinaryOpUGen → Out) with bound ugen inputs, plus `sc-run` and displays. Tests the ugen input-reference validation and (later) graph compilation. |

## `bindings/` — scope & bind resolution

| plugin | purpose |
|---|---|
| `nested-groups-plugin` | Multi-segment bind paths (`outer.inner.deep.control`) through nested groups — tests `walkPath` + cumulative scopes. |
| `group-bind-plugin` | Group-level controls bound from synth params + per-synth run/range/display — tests cross-level binds. |
| `var-plugin` | `sc-var`s with arithmetic bind expressions (mirror, `vars.freq * 2`, sums, products) — tests `parseBind`/expression resolution. |
| `conditional-plugin` | `sc-if` with controls binding to siblings — tests that `sc-if` is scope-transparent. |

## `inputs/` — input widgets

| plugin | purpose |
|---|---|
| `select-plugin` | `sc-select`/`sc-option` dropdowns and `sc-radio-group`/`sc-radio` sets bound to controls/vars. |
| `waveselect-plugin` | A `Select` UGen switching SinOsc/Saw/Pulse, driven by an `sc-select` — an input wired into a synth graph. |

## `invalid/` — intentional failures (the negative fixtures)

Upload-time fixtures (rejected by the backend zip/XSD validation):

| plugin | fails with |
|---|---|
| `bad-metadata` | `"author" must be a non-empty string` |
| `bad-entry-xhtml` | ill-formed XML |
| `bad-entry-schema` | entry doesn't conform to the XSD |
| `bad-asset-type` | `svg` is not a supported asset type |
| `bad-asset-mismatch` | asset content (jpeg) ≠ declared type (png) |

Runtime fixtures (upload fine; the parse engine must reject them — each one
targets a single error path in the sc-elements runtime
(`internal/validation.ts` + the `resolveRuntime` overrides)):

| plugin | error path | fails with |
|---|---|---|
| `bad-bindings` | `checkDuplicateNames` | duplicate `sine` name in scope (the grab-bag legacy fixture: also carries unknown-node and undeclared-control binds behind the first error) |
| `bad-node-bind` | `resolveControlBind` | `bind="ghost.freq"` — no node `ghost` in scope |
| `bad-synthdef-bind` | `resolveControlBind` | `bind="sine.freq"` resolves to the *synthdef* (not a node) — the classic param-vs-control mistake |
| `bad-undeclared-control` | `resolveControlBind` | `bind="s1.detune"` — `s1` declares no `detune` control |
| `bad-circular-bind` | `resolveStateBind` (self-reference guard) | an `sc-var` bound to itself (`a → vars.a`) — the only cycle expressible now that references point strictly backward |
| `bad-forward-ref` | `resolveNode` | controls/inputs reference a synth declared *after* them — bind targets must be declared before their references in DOM order |
| `bad-unknown-synthdef` | `synthHandler` | `<sc-synth bind="missing">` matches no `<sc-synthdef>` |
| `bad-run-bind` | `runHandler` | `<sc-run bind="ghost">` matches no node |
| `bad-ugen-input` | `collectUgenInputs` | a ugen `sc-control` with neither `bind` nor `value` |
| `bad-ugen-ref` | `ugenHandler` | a ugen input bound to `lfo`, which names no sibling ugen / param |

Not yet ported from the old app (buffer-family migration step):
`scope-plugin`, `waveform-plugin`, `test-plugin`.
