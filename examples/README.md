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
| `forward-ref-plugin` | Controls/inputs appear *before* the synth they reference — tests on-demand `resolve` during processing. |
| `nested-groups-plugin` | Multi-segment bind paths (`outer.inner.deep.control`) through nested groups — tests `walkPath` + cumulative scopes. |
| `group-bind-plugin` | Group-level controls bound from synth params + per-synth run/range/display — tests cross-level binds. |
| `var-plugin` | `sc-var`s with arithmetic bind expressions (mirror, `vars.freq * 2`, sums, products) — tests `parseBind`/expression resolution + circular-bind detection. |
| `conditional-plugin` | `sc-if` with controls binding to siblings — tests that `sc-if` is scope-transparent. |

## `inputs/` — input widgets

| plugin | purpose |
|---|---|
| `select-plugin` | `sc-select`/`sc-option` dropdowns and `sc-radio-group`/`sc-radio` sets bound to controls/vars. |
| `waveselect-plugin` | A `Select` UGen switching SinOsc/Saw/Pulse, driven by an `sc-select` — an input wired into a synth graph. |

## `invalid/` — intentional failures (the negative fixtures)

| plugin | fails at | with |
|---|---|---|
| `bad-metadata` | upload | `"author" must be a non-empty string` |
| `bad-entry-xhtml` | upload | ill-formed XML |
| `bad-entry-schema` | upload | entry doesn't conform to the XSD |
| `bad-asset-type` | upload | `svg` is not a supported asset type |
| `bad-asset-mismatch` | upload | asset content (jpeg) ≠ declared type (png) |
| `bad-bindings` | **runtime** (uploads fine) | first intentional error: duplicate `sine` name in scope; also carries unknown-synthdef and undeclared-control binds |

Not yet ported from the old app (buffer-family migration step):
`scope-plugin`, `waveform-plugin`, `test-plugin`.
