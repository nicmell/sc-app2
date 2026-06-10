# `src/sc-elements` — the plugin custom elements

The Lit web components plugin HTML is built from. They follow the recipe in the
root CLAUDE.md ("Migrating an sc-element"): HTML attributes are accessor
reactive properties on the component (typed by the `ScXProps` interfaces in
`@/types/runtime`), validation is the component's own `validate()` (called
during hydration — the real gate, since the upload-time XSD doesn't enforce
attribute rules), and **the element IS the runtime**: `resolveRuntime()`
resolves the runtime values and `process()` assigns them onto the component
itself (declared as plain fields on the `internal/` bases — `_rootScNode`/
`_parentScNode` (live element references, not ids) + `path`/`enabled` +
`_scChildren` for parents on `ScElement`, the category values on
`ScNode`/`ScState`/`ScInput`). The runtime registry (`@/runtime/registry`)
maps ids straight to the live components.

Everything is exported from the barrel (`index.ts`), which also owns
`registerScElements()` — one constructor per tag in `@/constants/sc-elements`,
kept in sync with the backend XSD.

Folders mirror the old sc-app's class/guard taxonomy:

```
internal/   the bases: ScElement (light-DOM root, validate helpers, the
            parse engine — hydrate/process/processChildren + the shared
            bind-resolution machinery — and the common runtime fields),
            ScNode (run + nodeId/loaded), ScState (name/value/bind +
            targets/expression), ScInput (bind + targetId)
nodes/      elements owning scsynth nodes        (isNodeRuntime)
synthdef/   the synth-graph declaration elements
state/      named values binds can target        (isStateRuntime)
inputs/     interactive controls
visuals/    read-only / conditional presentation
widgets/    self-contained app panels (new-app features, not in the old app)
```

Status: everything except sc-plugin and the widgets is a **stub** — parsed,
validated, and bind-resolved by the runtime processor, but with no OSC/UI
behavior yet. "Will:" notes describe the old app's semantics, which return
with the matching migration steps.

## `nodes/`

### `<sc-plugin>` — functional
The app-synthesized plugin root: **never written in plugin HTML** — PluginHost
creates one per dashboard box and sets its `plugin` property. It loads the
entry XHTML (XML-parsed + importNode), runs `processHtml` (registering the
parsed tree in the runtime registry), and owns the plugin's scsynth group:
`/g_new` inside the session group on mount, `/g_freeAll` + `/n_free` on
unmount. Renders a `<slot>` plus the parse error, if any.
Props: `run` (boolean attribute, `run="false"` is the only falsy spelling).

### `<sc-group>` — stub
A named container node. Props: `name` (required), `run`.
Will: own a nested scsynth group (`/g_new` on mount, freed on unmount);
group-level `sc-control` children become shared params.

### `<sc-synth>` — stub
A synth instance of an `sc-synthdef`. Props: `name` (required), `bind` (the
synthdef name), `run`. Children: `sc-control` params. The runtime validates
that `bind` resolves to a synthdef in scope.
Will: `/s_new` in its parent group once its synthdef (and deps) are loaded;
`/n_free` on unmount; controls become `/s_new` args.

## `synthdef/`

### `<sc-synthdef>` — stub
Declares a synth graph. Props: `name` (required). Children: `sc-control`
(params) + `sc-ugen` (nodes). The runtime collects params and per-ugen inputs
(validating each input has a `bind` or `value`).
Will: compile to SCgf via the UGen graph builder and `/d_recv` on load.

### `<sc-ugen>` — stub
One UGen node inside a synthdef. Props: `name` (required), `ugen` (the
**`type` attribute** — the SuperCollider UGen class; required), `rate`
(`ar|kr|ir`, default `ar`), `op` (operator for Binary/UnaryOpUGen). Children:
`sc-control` inputs; each input's `bind` must reference a sibling ugen or a
synthdef param (runtime-validated).

## `state/`

### `<sc-control>` — stub
A named parameter. Props: `name` (required), and exactly one of `value`
(number) or `bind` (a dot-path to another control/var, or an arithmetic
expression over paths — `vars.freq * 2`). Enabled when its parent is a node
(plugin/group/synth); disabled (pure graph input) inside synthdefs/ugens.
Will: `/n_set` its parent node when the value changes.

### `<sc-var>` — stub
A state variable: like `sc-control` but always enabled and never sent over
OSC. Props: `name` (required), `value` xor `bind` (expressions allowed).
Will: reactive frontend value, propagated to binds.

## `inputs/`

### `<sc-range>` — stub (renders an unstyled native `<input type="range">`)
Props: `bind` (target control/var path), `min`, `max`, `step`, `value`
(numbers, validated). XSD also allows the old presentational attributes
(`type` knob|slider, `diameter`, `width`, `height`, `src`, `sprites`,
`fgcolor`, `bgcolor`) — not declared yet.
Will: knob/slider UI dispatching the bound value.

### `<sc-checkbox>` — stub (renders an unstyled native `<input type="checkbox">`)
Props: `bind` (required). XSD also allows width/height/src/colors.
Will: toggle switch dispatching 0/1 to the bound value.

### `<sc-select>` — stub
A dropdown over its `<sc-option>` children. Props: `bind` (required).
Will: combobox UI dispatching the chosen option's value.

### `<sc-option>` — stub
One declarative choice. Props: `value` (number, required by the XSD),
`label`. Never enabled (consumed by the parent select).

### `<sc-radio-group>` / `<sc-radio>` — stubs
Radio set over `<sc-radio>` children. Group props: `bind` (required),
`orientation` (`horizontal|vertical`). Radio props: `value` (number), `label`
(+ XSD-allowed width/height/src/colors).
Will: radio UI dispatching the chosen value.

### `<sc-run>` — stub
Play/pause for a node. Props: `bind` (a node name; empty targets the parent
node — runtime-validated). XSD also allows size/src/colors.
Will: `/n_run` toggle button.

## `visuals/`

### `<sc-display>` — stub
Read-only formatted view of a bound value. Props: `bind` (required),
`format` (printf-style: `%d`, `%.2f`, `%b`, `%s`).

### `<sc-if>` — stub (children always render for now)
Conditional rendering keyed on a bound value. Props: `bind` (required); the
XSD allows the condition attributes (`is-truthy`, `is-falsy`, `is-equal`,
`is-not-equal`, `is-greater-than`, `is-lesser-than`) — not declared yet.
Children are parsed transparently (an `sc-if` does not create a scope).

## `widgets/` — functional, new-app features

### `<sc-console>`
The OSC console: the session's bounded tx/rx log (from the session store).
No attributes.

### `<sc-scope>`
The master-out oscilloscope fed by the SHM `/scope/chunk` stream
(`lib/scope/ScopeController` writes `chunkRef`; the canvas draws in a RAF
loop). No attributes. NOT the old buffer-bound sc-scope — that returns with
the buffer-family migration.

### `<sc-strudel>`
A Strudel editor whose patterns route to StrudelDirt through the OSC bridge
(`session.send` of timetagged `/dirt/play` bundles). No attributes.
