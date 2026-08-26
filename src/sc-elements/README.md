# `src/sc-elements` — the plugin custom elements

The Lit web components plugin HTML is built from. They follow the recipe in the
root CLAUDE.md ("Migrating an sc-element"): declarative HTML attributes live
in the sc-validate crate's authored `specs/<tag>.spec.json` (the spec IS the
attribute contract — it also drives the shared Rust validator; the frontend
reads the same map from the wasm module) and are read on
demand via
`getProp` (spec-coerced; only genuinely-reactive widget fields stay as Lit
properties). A spec-declared `default` is applied by `getProp` when neither
the static attr nor a settled bind supplies a value; undeclared attrs remain
`undefined`, so forwarded props defer to the base widget's own default. Every
spec attr (unless flagged `runtime: false`) accepts a
`bind:`-namespaced sibling holding a bind expression (`bind:min="vars.lo"`,
`bind:icon="s1.gate ? 'stop' : 'play'"`; entries declare
`xmlns:bind="urn:sc-app:bind"` on the root) — mutually exclusive with the
static form, evaluated live and reactive on its sources; `getProp` then
returns the evaluated value. Static validation lives in the shared Rust
`src-tauri/crates/sc-validate` crate (native at upload, wasm via
`lib/plugins/validate` at `parseEntry`); the spec drives both that gate and
`getProp` coercion. Violations are TYPED: each carries a nested `kind` — a
stable kebab-case code plus a structured payload (attr/value/allowed/bound)
— and a 1-based, attribute-precise line:column position; the TS shapes are
generated from the Rust types by tsify and re-exported by
`lib/plugins/validate` (`ViolationKind`, `ParseErrorCode`). The engine now runs identity + the ONE extension hook
`resolveRuntime(ctx)` — runtime construction: the recursion into the sc
children where the element opens a level (`processChildren`) plus
bind/reference resolution. **The element IS the
runtime**: the runtime values are plain fields mutated in place (all plain fields
on the `internal/` bases — `_rootScNode`/`_parentScNode` (live element
references, not ids) + `basePath` + the
runtime-prop machinery on `ScElement`; `_scChildren` + `processChildren` +
the load/unload child walks on `ScParent`, extended only by the level
openers; the category values on
`ScNode`/`ScState`/`ScInput`). There is no global element registry — the
parsed tree hangs off the mounted `<sc-plugin>` root (`_scChildren`).

Everything is exported from the barrel (`index.ts`), which also owns
`registerScElements()` — one constructor per tag in `@/constants/sc-elements`,
kept in sync with the spec map by the wasm-specs vitest (the ELEMENTS ↔
spec bijection).

Folders follow the element class/guard taxonomy:

```
internal/   engine/ (the parse ENGINE — index.ts: free process/
            processChildren over a cursor ctx — identity, core, error
            shape; plus its validation.ts, resolution.ts, contentHash.ts);
            ScElement (the common runtime fields, the resolveRuntime
            hook, AND the runtime-prop
            machinery: `bind:attr` → runtimeProps (targets/expression), the live
            evaluated values behind `getProp`, `updateRuntimeValue` +
            "statechange" on the `value` slot — the value seam everything
            reads); sc-parent.ts (ScParent — the level openers' base:
            `_scChildren`, the parse-scope walker, processChildren, the
            load/unload child walks); engine/validation.ts (static coercion
            toolbox + failValidation); engine/resolution.ts (runtime
            resolution toolbox:
            name/transparency semantics, duplicate-name integrity,
            name-path + bind-expression resolution — all plain functions
            over the elements);
            the category bases ScNode (nodeId/loaded + setRunning),
            ScState (`_state` = the `value` runtime slot + the plugin root's
            instance-store backing for LITERAL state, reached via
            `_rootScNode`), ScInput (targetScState + commit — the writing
            half of inputs); spec.ts (bindAttr/COMMON_ATTRS + the
            lib/plugins/validate getSpec re-export — the wasm-served spec map)
nodes/      elements owning scsynth nodes        (isNodeRuntime)
synthdef/   the synth-graph declaration elements
state/      named values binds can target        (isStateRuntime)
inputs/     interactive controls
visuals/    read-only / conditional presentation
widgets/    self-contained app panels (scope/console/strudel/keyboard)
```

Within each category (except `internal/`) every element lives in its own folder
— `<category>/<sc-name>/<sc-name>.ts` (+ its `.scss`/`.module.scss`, if any) with an
`index.ts` re-export, so `@/sc-elements/<category>/<sc-name>` resolves unchanged.

Status: every registered element is **functional**; the buffer family remains
un-migrated. `run="false"` on nodes is parsed but not yet honored at load.
See the root CLAUDE.md implementation plan.

## `nodes/`

### `<sc-plugin>` — functional

The authored entry root is the runtime host. PluginHost mounts one per dashboard
box; the loader validates, imports, and upgrades the whole authored root
through the main document. Display `title` and `description` live in
`metadata.json` / `PluginInfo`. It then runs `process()` (static validation
happened in `parseEntry`; each element mints its deterministic path-chained
hash id) and owns the
plugin's scsynth group:
`/g_new` inside the session group on mount, `/g_freeAll` + `/n_free` on
unmount. Renders a `<slot>` plus the parse error, if any. No attributes.

### `<sc-group>` — functional

A named container node. Props: `name` (required), `run` (parsed but not yet honored).
The load pass `/g_new`s its own group node FIRST — the
inverse of sc-synth's children-first order — so its children's
`targetGroupId` walk finds it live; nested groups nest. Group-level
`sc-control` children key under the group path and `/n_set` the GROUP node
on writes (scsynth fans a group `/n_set` out to every node inside — the
server-side mechanism). Unload
resets flags only: the subtree dies with the plugin group's wholesale
teardown.

### `<sc-synth>` — functional

A synth instance of an `sc-synthdef`. Props: `name` and `synthdef` (both required;
the latter is runtime-validated to resolve to an actual synthdef in
scope), `run` (`run="false"` is parsed but not yet honored).
Children: `sc-control` params. The load pass `/s_new`s it into the nearest
loaded ancestor group AFTER its children settle (their `_state` bakes in as
the control pairs), gated on `/n_go`, with a catch-up `/n_set` diff for
writes landing in the send→ack window. The node dies with the plugin
group's `/g_freeAll` (no per-synth `/n_free`).

## `synthdef/`

### `<sc-synthdef>` — functional

Declares a synth graph. Props: `name` (required). Children: `sc-control`
(params) + `sc-ugen` (nodes). The parse collects params and per-ugen inputs
(validating each input has a `bind:value` or `value`); the load pass compiles to
SCgf (`lib/synthdef/compileSynthDef`) and `/d_recv`s it, awaiting the
embedded `/sync` ack; `/d_free` on unmount. Known old-app-parity
limitation: synthdef names are global to scsynth.

### `<sc-ugen>` — functional (parse-time)

One UGen node inside a synthdef. Props: `name` (required), `type` (the
SuperCollider UGen class; required), `rate` (`ar|kr|ir`, default `ar`),
`op` (operator for Binary/UnaryOpUGen). Children: `sc-control` inputs; each
input's `bind:value` must reference a sibling ugen or a synthdef param
(runtime-validated).

## `state/`

### `<sc-control>`

A named parameter. Props: `name` (required), and exactly one of `value`
(a numeric scalar or array) or `bind:value` (a dot-path to another control/var, or an expression
over paths — arithmetic, comparisons evaluating to 1/0, the ternary,
string literals: `vars.freq * 2`, `vars.amp > 0.9`; a bare name-shaped
expression is always a PATH, so hyphenated names like `fm.mod-freq` stay
addressable). Enabled when its parent is a node (plugin/group/synth);
disabled (pure graph input) inside ugens — where the SAME `bind:value`
spelling is a graph-input REFERENCE (`bind:value="lfo"`) the synthdef
collectors consume raw; on a synthdef PARAM a `bind:` is a parse error, and
the attribute surface is validated directly from each element's spec.
`/n_set`s its parent node when the value changes (user writes and derived
recomputes alike), coercing at the boundary — a string value skips the send
with a console warning.

### `<sc-var>`

A state variable: like `sc-control` but always live and never sent over
OSC. Props: `name` (required), `value` xor `bind:value` (expressions allowed;
`value` is a plain — non-strict — vector: a string literal like `value="lin"` is legal state).
Its live value is `_state` on the shared state machinery: a literal var is
one runtime-store key (path-keyed, like controls), a derived var recomputes
element-to-element from its targets' statechange (no store key) and is
read-only to inputs. Transparent containers (sc-if) add no path segment, so
a var inside one keys at the ENCLOSING level — and collides with a
same-named outer sibling in the flat duplicate check (`bad-if-shadow`). The
must-be-declared-on-a-node rule survives as a defensive guard for genuinely
non-node levels (e.g. inside a synthdef).

## `inputs/`

The value inputs bind through `bind:value` exactly like the visuals — the
ScElement runtime-prop machinery carries the whole READ side (resolution,
subscription, recompute), and the `ScInput` seam adds only the write half:
`targetScState` (a PLAIN single-path `bind:value` resolves to one writable
state element; an EXPRESSION has no writable target — the input becomes a
read-only live meter, and a static `value` a fixed inert widget),
`syncFromState()` mapping the live value onto the widget (riding the
`runtimeValueChanged` hook — coercing, non-numeric strings leave the widget
as-is), and `commit()` — `setValue()` then a re-read snap-back so inert
gestures revert. The presentational props not opted out in each spec
(min/max/step/label/placeholder/disabled) accept the `bind:` form and
re-render live.

### `<sc-slider>` — functional (ui-components `<sc-base-slider>`)

Props (all forwarded to the inner slider): `value` (required — in practice
`bind:value="s1.freq"`; a plain path is writable, an expression is a
read-only meter, a static number a fixed widget), `min`, `max`, `step`,
plus `label`, `size` (sm|md|lg), `orientation` (horizontal|vertical),
`disabled`. Writes go via `commit()` on the slider's composed `input`.

### `<sc-knob>` — functional (ui-components `<sc-base-knob>`)

The rotary sibling of sc-slider: the same seam and forwarding, minus
`orientation` (a knob has none), rendering `<sc-base-knob>` (dial visual,
dominant-axis drag). Props: `value` (required, usually `bind:value`), `min`,
`max`, `step`, `label`, `size`, `disabled`.

### `<sc-checkbox>` — functional (ui-components `<sc-base-checkbox>`)

Props: `value` (required, usually `bind:value`), `label`, `size`,
`disabled`. Checked maps to 1/0 through the shared ScInput seam (inert
against derived state, snaps back).

### `<sc-switch>` — functional (ui-components `<sc-base-switch>`)

The toggle sibling of sc-checkbox: same 1/0 seam, rendering `<sc-base-switch>`
(track + thumb), minus `label` (the base switch has none). Props: `value`
(required, usually `bind:value`), `size`, `disabled`.

### `<sc-select>` — functional (ui-components `<sc-base-select>`)

A dropdown over its `<sc-option>` children. Props: `value` (required,
usually `bind:value`), `placeholder`, `size`, `disabled`. Collects each option's `{value,label}` at
parse and projects them as `<sc-base-option>`s; the selection syncs from the
target's `_state` and a choice dispatches through `commit()`.

### `<sc-option>` — data element

One declarative choice. Props: `value` (number, required by the spec),
`label` (required). Pure data — consumed by the parent select at parse.

### `<sc-radio-group>` / `<sc-radio>` — functional (ui-components `<sc-base-radio-group>`)

Radio set over `<sc-radio>` children. Group props: `value` (required,
usually `bind:value`), `orientation` (`horizontal|vertical`), `label`,
`size`, `disabled`. Radio
props: `value` (number, required), `label` (required) — collected and
projected as `<sc-base-radio>`s exactly like select/option.

### `<sc-button>` — functional (ui-components `<sc-base-button>`)

A push button over the ScInput seam — WRITE-ONLY: `bind:value` must be a
plain writable path (an expression or static value fails at parse,
the resolveRuntime override). Props: `value` (required, the binding slot), `set`
(a fixed value to write on click, runtime-capable as `bind:set`; ABSENT =
the click TOGGLES the target 0 ↔ 1 on the live value's truthiness),
`label`, `icon`, `disabled` (all three runtime-capable —
`bind:icon="s1.gate ? 'stop' : 'play'"` is the flagship swap), `variant`
(primary|secondary|ghost|danger), `size`.

### `<sc-envelope>` — functional (canvas)

The draggable-breakpoint envelope editor over an ordinary ARRAY-valued
control/var holding an `Env.asArray` encoding (`bind:value` — a plain
WRITABLE path; the codec is lib/synthdef/envValue.ts, zero-padded to the
bound array's width with the true segment count in the header). Gestures:
drag points (level + segment time; pinned to the canvas edges — the scale
freezes per gesture, so nothing reshapes on release), drag a segment
midpoint to bend its curvature (double-click resets to linear),
double-click to insert/remove breakpoints. A readout shows the grabbed
handle's live value. Props: `value` (required), `minbreakpoints`/
`maxbreakpoints` (count bounds incl. the start point — EQUAL bounds lock
the structure while positions stay draggable, keeping `env.N` slot-lens
binds meaningful). Authoring defaults pair naturally with the expression
plane: `value="pad(adsr(0.02, 0.15, 0.6, 0.3), 36)"`.

## `visuals/`

sc-display and sc-if are read-only SINKS on the state graph, running
entirely on the ScElement runtime-prop machinery — their condition/value is a full
evaluable expression (plain paths, arithmetic, comparisons, ternaries,
string literals), resolved like `bind:value` binds and recomputed on every
source statechange; the render reads it back through `getProp`.

### `<sc-display>`

Read-only formatted view of a value: static `value` or the dynamic
`bind:value` expression (`bind:value="s1.freq"`, `bind:value="vars.amp * 100"`,
`bind:value="osc.gate ? 'playing' : 'stopped'"`). Props: `value` (required, in
either form), `format` (printf-style: `%d`, `%.2f`, `%b`, `%s` — itself
runtime-capable as `bind:format`). Renders through `<sc-text as="label">`, so
display output follows the same typography primitive as authored text.

### `<sc-if>`

Conditional rendering on the TRUTHINESS of the `bind:when` expression
(`bind:when="osc.gate"`, `bind:when="vars.freq > 440"`, `bind:when="osc.gate == 0"`):
the children show when the value is truthy (non-zero, non-empty string).
Props: `when` (required — in practice always the `bind:when` form).
Hidden = the `hidden` attribute + sc-if.scss (`display: contents` /
`[hidden] display: none`). sc-if is a TRANSPARENT container: it opens no
sibling scope and no path segment — its contents are collected,
duplicate-checked (`bad-if-shadow`), and processed by the ENCLOSING level
(they attach DIRECTLY to the enclosing node — `_parentScNode` walks through
transparency, the sc-if stays a runtime-tree leaf). Full block content is allowed and
is UNCONDITIONALLY live — a synth inside a hidden sc-if keeps playing, a var
keys at the enclosing path, an outer sibling can bind to elements inside —
only visibility follows the condition.

### `<sc-text>`

Typography wrapper over ui-components `<sc-base-text>`. Props: `as`
(`span|p|div|label|h1|h2|h3|h4|h5|h6`), `size` (`xs|sm|md|lg|xl`),
`weight` (`regular|medium|bold`), `tone`
(`default|dim|mute|faint|primary|ok|warn|error|info`), `font` (`sans|mono`),
`align` (`start|center|end`), `transform`
(`none|uppercase|lowercase|capitalize`), `truncate`, `inline`. Content is
mixed inline content, including nested `sc-display`, `sc-if`, and `sc-text`.

### `<sc-flex>`

Neutral flexbox layout wrapper over `<sc-base-flex>`. Props: `orientation`
(`horizontal|vertical`), `wrap`, `justify`
(`start|center|end|space-between|space-around|space-evenly`), `align`
(`start|center|end|stretch|baseline`), `gap` (`none|xs|sm|md|lg`). Content
accepts normal block plugin content.

### `<sc-row>` / `<sc-col>`

Non-responsive 24-unit grid wrappers over `<sc-base-row>` and `<sc-base-col>`.
Row props: `align` (`top|middle|bottom|stretch`) and `gutter`
(`none|xs|sm|md|lg`). Row content is `sc-col` children. Column props:
`span` (1–24, or 0 to hide), `offset` (0–23), and `order` (-24–24). These are
static structural attributes;
column content accepts normal block plugin content.

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
disconnects. Bus-based only — the buffer-bound variant arrives with the
buffer-family migration.

### `<sc-strudel>`

A Strudel editor whose patterns route to StrudelDirt through the OSC bridge
(timetagged `/dirt/play` bundles). Optional `value` holds the initial pattern
code (the built-in pattern is used when absent); `\\n` in an XML attribute
decodes to a real newline. A plain-path `bind:value` is two-way per keystroke,
while an expression bind only drives the editor. Editor writes contain raw
newlines, so a literal backslash-n cannot be represented through the attribute.
`orbit` stamps a default orbit onto events the pattern doesn't route itself
(`.orbit(n)` wins). The editor works offline; unload stops playback on
connection loss.

### `<sc-keyboard>`

An on-screen MIDI-style piano spawning a transient voice per pressed key
from a referenced synthdef (`synthdef`, required — must name an
`<sc-synthdef>` in scope): `/s_new` into the plugin group with
`freq = note.midicps` and `amp = velocity`, gate-0 on release (the def
pairs gate with a doneAction so voices self-free). Three input sources
funnel into ONE held-note map: pointer (velocity from the vertical click
position), the computer tracker row (`a…k`), and Web MIDI hardware.
Releases racing the `/n_go` ack are deferred; a lost ack `/n_free`s the
allocated id; focus leaving the element releases everything held. Props:
`freq`/`amp`/`gate` remap the def's param names; `octaves`/`start` set the
drawn range; `envelope` (usually `bind:envelope="env"`) latches an
Env.asArray value into each voice on the def's SINGLE array param — new
voices sound the current shape, playing voices keep the one they were born
with.
