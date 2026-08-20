# Next steps

Observations collected at the `feat/env-editor` merge (2026-07-12): open
follow-ups carried over from the retired planning docs (XSD-CODEGEN-DRAFT,
SYNTHDEF-ENV-NOTES), review findings accepted-but-not-fixed on the branch,
and the expression-language growth path. Ordered by expected value.

## Expression-language growth (`src/lib/expression/`)

The function-call machinery now has three evaluation planes (static value /
runtime bind / graph lowering) — each new function lands in all three for
the price of one registry entry. Highest-value additions:

1. **SC's unary math ops as functions** — `midicps(n)`, `cpsmidi(n)`,
   `dbamp(db)`, `ampdb(a)`, `abs`, `sqrt`, `exp`, `log`, `floor`, `ceil`.
   Graph plane lowers to `UnaryOpUGen` (the operator table already has the
   special indices); client plane is plain Math. Unlocks idiomatic pitch
   and loudness math everywhere (`bind:value="midicps(note)"`,
   `freq: "midicps(base + interval)"` in defs).
2. **Binary op functions** — `min(a, b)`, `max`, `pow`, `mod`, `clip(x, lo,
   hi)`, `fold`, `wrap` (BinaryOpUGen indices exist for all; clip/fold/wrap
   compose from clip2 semantics or two-op chains). The infix grammar can't
   spell these; call syntax can.
3. **Range mapping** — `linlin(x, inLo, inHi, outLo, outHi)`, `linexp`,
   `explin`: the SC bread-and-butter idioms, lowered as an op-node
   composition (client mirror trivial). Turns most "knob scales something"
   expressions from arithmetic soup into one readable call.
4. **`rand(lo, hi)` — graph-only** — lowers to the `Rand` UGen: per-voice
   randomization at `/s_new` time (detune, pan spread) with zero client
   machinery. Client/static planes reject it (no `Math.random` semantics in
   deterministic state).
5. **Keyword args** — the grammar deliberately reserved `name: value` (no
   positional tails were added): needed for envelope `curve:` overrides
   (authored `adsr(…)` is pinned to curvature −4 today) and for
   `releaseNode:`/`loopNode:` on `new`/`step` (the two shapes currently
   rejected because two flat arrays can't share one positional list).

## Engine / element follow-ups

- **sc-keyboard template controls** (designed, deferred): child
  `sc-control`s as the per-voice template — kills the special `envelope`
  prop, generalizes per-voice params (cutoff, pan, detune), gives
  store-backed master gain. The `bind:envelope` seam stays until then.
- **Per-session audio-bus spans** (`core/blocks.rs`, like scope slots and
  node-id blocks): private buses per mount. Bus 16/17 in the env examples
  are global to scsynth — two mounts of the same rig sum their traces
  (the debugging saga of this branch). Backend step, own branch.
- **Honor `run="false"`** after node creation (`/n_run` — attribute parsed,
  ignored; the old app's create-then-run sequence).
- **sc-scope tap re-arm**: `bus`/`channels`/`frames` are `runtime: false`
  only because there's no re-tap machinery — lift by re-running the
  subscription on recompute.
- **Partial plugin-load rollback**: a rejected child load surfaces in the
  plugin error box but does NOT `unload()` — the plugin group and earlier
  children stay live until disconnect/unmount.
- **`/d_recv` ack racing a superseded load epoch**: the def refuses `loaded`
  but the installed global definition escapes `unload()`'s guard — the
  stale completion should `/d_free`, with a regression test.
- **sc-col grid integer contract**: the static stylesheet covers `span`
  0–24, `offset` 1–23, `order` −24–24; the spec accepts any integer —
  out-of-range values silently miss their selector. Add bounds to the spec
  or an element validator.
- **Recompute batching**: one listener per (prop, target) today — an
  element with N props on one source recomputes N times per change. Fine at
  this scale; batch per (element, target) when it isn't.

## Accepted quirks (documented so nobody re-discovers them)

- Evaluated `bind:` values get type/enum warnings but NO range checks
  (`bind:gain` going non-positive degrades silently).
- happy-dom's XML parser drops the later of two attributes whose LOCAL
  names collide (`value` + `bind:value`) — irrelevant to the gate since the
  Rust validator (roxmltree) sees both, but worth reporting upstream.
- `getProp` is untyped by design (`as number` casts at call sites); typed
  helpers if the noise grows.
- Static-value widgets show their Lit default until their sequential load
  turn seeds them.
- Diamond bind dependencies can transiently double-dispatch before
  converging (Object.is-guarded per hop).
- sc-display renders arrays as comma-lists; MCE arrays are flat (no
  nesting).
- The envelope editor's time axis re-zooms on release when a drag extended
  the total duration (shape-preserving; the alternative locks the length).
- Known old-app-parity limit: synthdef names are global to scsynth — two
  plugins declaring the same name overwrite each other.
- Envelope latch semantics (by design): a keyboard voice latches its
  `bind:envelope` value INTO its own `/s_new` — new voices always sound the
  current shape; PLAYING voices keep the shape they were born with (no
  mid-flight structure rewrites — the da82382 corruption class).

## Roadmap items unchanged by this branch

- Buffers & scopes step 7 (sc-buffer alloc/free, sc-waveform recorder over
  a scope tap; bufnums as a server-assigned span).
- Presets/overrides (step 8) — array values are JSON-ready; literal keys
  only.
- Shell polish (step 9): settings, logger.
- Registry-driven variadic-input flags (replace the hardcoded
  ARRAY_INPUTS set) and rate inference for AUTHORED ugens (op nodes
  already infer).
