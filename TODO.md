# TODO — the backlog

Planned work and open follow-ups, ordered by area. Design details that a
step depends on live inline; everything here is UNSTARTED unless noted.

## Roadmap (the big steps)

1. **Honor `run="false"`** on sc-synth/sc-group: the create-then-`/n_run 0`
   sequence after the create ack. The plumbing exists (`setRunning` on
   sc-node, `OscClient.setNodeRun`); only the load-pass honoring is missing.
2. **Buffer family** — designed around the SHM transport (no `/b_getn`, no
   global-clock machinery; the bus-based sc-scope already covers live-signal
   viewing):
   - `sc-buffer`: a thin alloc/free element — `/b_alloc` gated on `/done`,
     `/b_free` on unload; bufnum binding into synth controls; bufnums as a
     server-assigned per-session span like the scope slots (core/blocks.rs),
     never a client-side counter.
   - `sc-waveform`: a client-side recorder (record/pan/zoom over a growing
     Float32Array) fed by an SHM scope-tap subscription.
   - A `/b_getn` reader + buffer WS stack is the fallback ONLY if reading
     actual buffer CONTENTS (vs the live signal) ever becomes necessary.
3. **Persistence & presets** — extend the saved-session layout payload with
   per-box `OverrideEntry[]` presets, marshalled as sparse diffs read from
   the element's per-instance runtime store via the mounted host's name-path
   walk — LITERAL keys only (derived values live on the elements and
   recompute; a preset writing a bound key would create an orphan store
   entry nothing reads).
4. **Shell polish** — settings (grid size, latency); theme/options store
   slice.

## Expression-language growth (`src/lib/expression/`)

The function-call machinery has three evaluation planes (static value /
runtime bind / graph lowering) — each new function lands in all three for
one registry entry:

1. SC's unary math ops — `midicps`, `cpsmidi`, `dbamp`, `ampdb`, `abs`,
   `sqrt`, `exp`, `log`, `floor`, `ceil` (graph plane lowers to UnaryOpUGen;
   client plane is Math).
2. Binary op functions — `min`, `max`, `pow`, `mod`, `clip(x, lo, hi)`,
   `fold`, `wrap` (BinaryOpUGen indices exist; the infix grammar can't spell
   these, call syntax can).
3. Range mapping — `linlin(x, inLo, inHi, outLo, outHi)`, `linexp`,
   `explin`.
4. `rand(lo, hi)` — GRAPH-ONLY (`Rand` UGen; per-voice randomization at
   /s_new time). Client/static planes reject it.
5. Keyword args (`name: value`): envelope `curve:` overrides and
   `releaseNode:`/`loopNode:` on `new`/`step`.

## Engine / element follow-ups

- **sc-keyboard template controls** (designed, deferred): child
  `sc-control`s as the per-voice template — kills the special `envelope`
  prop, generalizes per-voice params, gives store-backed master gain.
- **Per-session audio-bus spans** (core/blocks.rs, like scope slots): the
  env examples' buses 16/17 are global to scsynth — two mounts of the same
  rig sum their traces. Backend step.
- **sc-scope tap re-arm**: `bus`/`channels`/`frames` are `runtime: false`
  only because there's no re-tap machinery — lift by re-running the
  subscription on recompute.
- **Partial plugin-load rollback**: a rejected child load surfaces in the
  plugin error box but does NOT `unload()` — the group and earlier children
  stay live until disconnect/unmount.
- **`/d_recv` ack racing a superseded load epoch**: the stale completion
  should `/d_free` the escaped global definition (+ regression test).
- **sc-col grid integer bounds**: the static stylesheet covers `span` 0–24,
  `offset` 1–23, `order` −24–24; the spec accepts any integer — add facets.
- **Recompute batching**: one listener per (prop, target) — batch per
  (element, target) if N-prop single-source elements ever hurt.
- **Registry-driven variadic-input flags** (replace the hardcoded
  ARRAY_INPUTS set) and rate inference for AUTHORED ugens.

## Error/HTTP plane

- Per-evaluate timeouts in the e2e CDP client (socket death is guarded; a
  wedged page can still hang a suite).
- Advisory file lock on plugins.json (CLI vs server write race; also lifts
  the one-registry-writer test constraint).
- A scsynth-down negative e2e suite (boot the stack without start-osc.sh,
  assert the RouteError/503-retry story in a real browser).
- Drawer-open `refreshPlugins()` (sync results visible without a page
  reload); later a registry-changed WS push, which would justify an
  `examples:watch` watcher.

## UI nits

- Button with icon: better centering; a loading button.
- SCSS everywhere in the main app.
- Strudel deps chunked (bundle size).
