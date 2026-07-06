# `src/sc-elements` — the plugin custom elements

The Lit web components plugin HTML is built from. They follow the recipe in the
root CLAUDE.md ("Migrating an sc-element"): HTML attributes are accessor
reactive properties on the component (the class IS the attribute contract —
no parallel props interfaces), validation is the component's own `validate()` (called
by `process` during parse — the real gate, since the upload-time XSD doesn't enforce
attribute rules), and **the element IS the runtime**: `resolveRuntime()`
resolves the runtime values and `process()` assigns them onto the component
itself (declared as plain fields on the `internal/` bases — `_rootScNode`/
`_parentScNode` (live element references, not ids) + `path`/`enabled` +
`_scChildren` for parents on `ScElement`, the category values on
`ScNode`/`ScDerived`/`ScState`/`ScInput`). The runtime registry
(`@/runtime/registry`) maps ids straight to the live components.

Everything is exported from the barrel (`index.ts`), which also owns
`registerScElements()` — one constructor per tag in `@/constants/sc-elements`,
kept in sync with the backend XSD.

Folders mirror the old sc-app's class/guard taxonomy:

```
internal/   ScElement (light-DOM root, the parse engine — hydrate/process/
            processChildren — and the common runtime fields); validation.ts
            (the require*/failValidation primitives + the bind-resolution
            machinery, as plain functions over the elements); the category
            bases ScNode (run + nodeId/loaded), ScDerived (bind →
            targets/expression, the live `_state` + "statechange" event —
            the value seam everything reads), ScState extends it
            (name/value + the store backing for LITERAL state), ScInput
            (bind + _targetScNode — the writing inputs)
nodes/      elements owning scsynth nodes        (isNodeRuntime)
synthdef/   the synth-graph declaration elements
state/      named values binds can target        (isStateRuntime)
inputs/     interactive controls
visuals/    read-only / conditional presentation
widgets/    self-contained app panels (new-app features, not in the old app)
```

Within each category (except `internal/`) every element lives in its own folder
— `<category>/<sc-name>/<sc-name>.ts` (+ its `.module.scss`, if any) with an
`index.ts` re-export, so `@/sc-elements/<category>/<sc-name>` resolves unchanged.

Status: the synth path (plugin/synthdef/ugen/synth/control) and the state
layer (var/display/if + the range/checkbox inputs) are **functional**; the
remaining **stubs** — parsed, validated, and bind-resolved, but with no
OSC/UI behavior yet — are sc-group (no own /g_new), sc-run, and the
selection inputs (sc-select/sc-option, sc-radio-group/sc-radio). "Will:"
notes on stubs describe the old app's semantics, which return with the
matching migration steps (see the root CLAUDE.md migration plan).

## `nodes/`

### `<sc-plugin>` — functional

The app-synthesized plugin root: **never written in plugin HTML** — PluginHost
renders one per dashboard box declaratively (React mounts custom elements like
any DOM tag), with the box's id as its DOM id. It resolves its plugin from the
layout/plugins stores by that id, loads the entry XHTML (XML-parsed +
importNode), runs `process()` (validation inside — the id is already
its own; the registry then adopts the parsed tree), and owns the plugin's
scsynth group:
`/g_new` inside the session group on mount, `/g_freeAll` + `/n_free` on
unmount. Renders a `<slot>` plus the parse error, if any.
Props: `run` (boolean attribute, `run="false"` is the only falsy spelling).

### `<sc-group>` — stub

A named container node. Props: `name` (required), `run`.
Will: own a nested scsynth group (`/g_new` on mount, freed on unmount);
group-level `sc-control` children become shared params.

### `<sc-synth>` — functional

A synth instance of an `sc-synthdef`. Props: `name` (required), `bind` (the
synthdef name — runtime-validated to resolve to an actual synthdef in
scope), `run` (`run="false"` parsed, honored at the node-lifecycle step).
Children: `sc-control` params. The load pass `/s_new`s it into the nearest
loaded ancestor group AFTER its children settle (their `_state` bakes in as
the control pairs), gated on `/n_go`, with a catch-up `/n_set` diff for
writes landing in the send→ack window. The node dies with the plugin
group's `/g_freeAll` (no per-synth `/n_free`).

## `synthdef/`

### `<sc-synthdef>` — functional

Declares a synth graph. Props: `name` (required). Children: `sc-control`
(params) + `sc-ugen` (nodes). The parse collects params and per-ugen inputs
(validating each input has a `bind` or `value`); the load pass compiles to
SCgf (`lib/synthdef/compileSynthDef`) and `/d_recv`s it, awaiting the
embedded `/sync` ack; `/d_free` on unmount. Known old-app-parity
limitation: synthdef names are global to scsynth.

### `<sc-ugen>` — functional (parse-time)

One UGen node inside a synthdef. Props: `name` (required), `ugen` (the
**`type` attribute** — the SuperCollider UGen class; required), `rate`
(`ar|kr|ir`, default `ar`), `op` (operator for Binary/UnaryOpUGen). Children:
`sc-control` inputs; each input's `bind` must reference a sibling ugen or a
synthdef param (runtime-validated).

## `state/`

### `<sc-control>`

A named parameter. Props: `name` (required), and exactly one of `value`
(number) or `bind` (a dot-path to another control/var, or an expression over
paths — arithmetic plus comparisons: `vars.freq * 2`, `vars.amp > 0.9`
evaluating to 1/0; a bare name-shaped bind is always a PATH, so hyphenated
names like `fm.mod-freq` stay addressable). Enabled when its parent is a
node (plugin/group/synth); disabled (pure graph input) inside
synthdefs/ugens. `/n_set`s its parent node when the value changes (user
writes and bound recomputes alike).

### `<sc-var>`

A state variable: like `sc-control` but always enabled and never sent over
OSC. Props: `name` (required), `value` xor `bind` (expressions allowed).
Its live value is `_state` on the shared ScDerived base: a literal var is
one store-slice key (path-keyed, like controls), a bound var recomputes
element-to-element from its targets' statechange (no store key) and is
read-only to inputs. A var must be declared ON A NODE (plugin/group/synth)
— inside a path-transparent container (sc-if) it would share an outer var's
store key (`bad-var-scope` pins the parse error).

## `inputs/`

The value inputs share the `ScInput` seam: one subscription to the target's
`_state` over the load/unload/disconnect lifecycle, `syncFromState()` mapping
the value onto the widget, and `commit()` — `setValue()` then a re-read
snap-back so a gesture against BOUND (derived, read-only) state reverts.

### `<sc-range>` — functional (ui-components `<sc-base-slider>`)

Props (all forwarded to the inner slider): `bind` (target control/var path),
`min`, `max`, `step`, `value` (numbers, validated), plus `label`, `size`
(sm|md|lg), `orientation` (horizontal|vertical), `disabled`. Reads the target
through `_state`/`onStateChange`, writes via `commit()` on the slider's
composed `input`. XSD also allows the legacy presentational attributes
(`width`, `height`, `src`, `sprites`, `fgcolor`, `bgcolor`) — not declared yet.

### `<sc-knob>` — functional (ui-components `<sc-base-knob>`)

The rotary sibling of sc-range: the same seam and forwarding, minus
`orientation` (a knob has none), rendering `<sc-base-knob>` (dial visual,
dominant-axis drag). Props: `bind`, `min`, `max`, `step`, `value`, `label`,
`size`, `disabled` (+ legacy `diameter`/`width`/`height`/`src`/colors in XSD).

### `<sc-checkbox>` — functional (ui-components `<sc-base-checkbox>`)

Props: `bind` (required), `label`, `size`, `disabled`. Checked maps to 1/0
through the shared ScInput seam (inert against bound state, snaps back). XSD
also allows width/height/src/colors.

### `<sc-switch>` — functional (ui-components `<sc-base-switch>`)

The toggle sibling of sc-checkbox: same 1/0 seam, rendering `<sc-base-switch>`
(track + thumb), minus `label` (the base switch has none). Props: `bind`
(required), `size`, `disabled`.

### `<sc-select>` — functional (ui-components `<sc-base-select>`)

A dropdown over its `<sc-option>` children. Props: `bind` (required),
`placeholder`, `size`, `disabled`. Collects each option's `{value,label}` at
parse and projects them as `<sc-base-option>`s; the selection syncs from the
target's `_state` and a choice dispatches through `commit()`.

### `<sc-option>` — data element

One declarative choice. Props: `value` (number, required by the XSD),
`label` (required). Never enabled — consumed by the parent select at parse.

### `<sc-radio-group>` / `<sc-radio>` — functional (ui-components `<sc-base-radio-group>`)

Radio set over `<sc-radio>` children. Group props: `bind` (required),
`orientation` (`horizontal|vertical`), `label`, `size`, `disabled`. Radio
props: `value` (number), `label` (+ XSD-allowed width/height/src/colors) —
collected and projected as `<sc-base-radio>`s exactly like select/option.

### `<sc-run>` — stub

Play/pause for a node. Props: `bind` (a node name; empty targets the parent
node — runtime-validated). XSD also allows size/src/colors.
Will: `/n_run` toggle button.

## `visuals/`

Both visuals extend `internal/sc-derived` (ScDerived) directly: a read-only
SINK on the state graph — `bind` is a full evaluable expression (plain
paths, arithmetic, comparisons), resolved like control/var binds and
recomputed on every source statechange into the live `_state` the subclass
renders from.

### `<sc-display>`

Read-only formatted view of an expression bind (`bind="s1.freq"`,
`bind="vars.amp * 100"`). Props: `bind` (required), `format` (printf-style:
`%d`, `%.2f`, `%b`, `%s`).

### `<sc-if>`

Conditional rendering on the TRUTHINESS of an expression bind
(`bind="osc.gate"`, `bind="vars.freq > 440"`, `bind="osc.gate == 0"`): the
children show when the derived value is non-zero. Props: `bind` (required).
Hidden = the `hidden` attribute + sc-if.scss (`display: contents` /
`[hidden] display: none`) — children stay mounted while hidden. Children are
parsed transparently (an `sc-if` does not create a scope) and must be
presentation content only: node elements are a parse error (`bad-if-node` —
hiding is visual-only, a "hidden" synth would still play; and a nested
same-named node would collide store keys), and vars are covered by their own
on-a-node placement rule (`bad-var-scope`).

## `widgets/` — functional, new-app features

### `<sc-console>`

The OSC console: the session's bounded tx/rx log (from the session store).
No attributes.

### `<sc-scope>`

An oscilloscope over `channels` consecutive buses starting at `bus`
(defaults: the stereo master out, bus 0 × 2). The element owns its whole
tap through the load pass: a ScopeOut2 tap synth at the session-group tail
writing a scope slot allocated from the session's span, plus the bridge's
`/scope/chunk` subscription (filtered by its own subId into `chunkRef`; the
canvas draws in a RAF loop). Unload reverses it all, so taps re-arm across
disconnects. NOT the old buffer-bound sc-scope — that returns with the
buffer-family migration.

### `<sc-strudel>`

A Strudel editor whose patterns route to StrudelDirt through the OSC bridge
(timetagged `/dirt/play` bundles). The element's text content is the initial
pattern code; `orbit` stamps a default orbit onto events the pattern doesn't
route itself (`.orbit(n)` wins). The editor works offline; unload stops
playback on connection loss.
