# SCDoc scrapers

Reproducible extraction of SuperCollider class metadata from the official docs
at [doc.sccode.org](https://doc.sccode.org), used to seed / cross-check the
`@sc-app/synthdef-compiler` registries. Raw HTML is cached under `.cache/`
(gitignored); extracted data lands in `out/` (committed).

| script | command | output |
| --- | --- | --- |
| `extract-env.mjs` | `yarn scdoc:env` | `out/env-doc.json` — every `Env` class-method constructor (params + defaults + arg docs) |
| `extract-ugens.mjs` | `yarn scdoc:ugens` | `out/ugens-doc.json` — one entry per standard UGen with an `ar`/`kr`/`ir` constructor (name, rates, defaults, argDocs) |
| `extract-server-commands.mjs` | `yarn scdoc:server` | `out/server-commands-doc.json` — every scsynth command/reply (address, arg table, prose) from the Server Command Reference, grouped by section |
| `diff-ugens.ts` | `yarn scdoc:diff` | `out/ugens-diff.md` — the crawl vs the committed registry |

Reconciliation is now a JSON-level hand edit of
`assets/specs/ugens.json`, guided by `yarn scdoc:diff` and its
`out/ugens-diff.md` report.

The UGen class list + categories come from the site's `docmap.js` (the
machine-readable index behind `Browse.html#UGens`); each class page supplies the
method signatures. `lib.mjs` holds the shared HTML/docmap parsing.

## Generated output vs the committed registry

The extracted `out/*.json` come from **SCDoc HTML**; the committed source of
truth is `assets/specs/*.json`. Rust registries and builders are emitted from
those specs by each crate's `build.rs`, while the TypeScript registries import
the same JSON directly. The crawl and specs are aligned where it matters but
**not identical** — the remaining differences below are intentional, not bugs.

### UGens — `out/ugens-doc.json` vs `assets/specs/ugens.json`

Full classification in `out/ugens-diff.md` (regenerate with `yarn scdoc:diff`).
Current state: **302** in common, **48** only in doc, **65** only in registry,
**0** rate mismatches, **77** arg-name diffs, **106** default-value diffs.

The historical reconciliation is already baked into the spec: the **rate
lists** (45 mismatches → 0) and the **8 genuine default bugs**
(`Convolution2/2L/3` + `StereoConvolution2L` framesize 512→2048,
`Spring.spring` 0→1, `GrainBuf.pos` 1→0, `Warp1.windowSize` 0.1→0.2,
`PSinGrain.amp` 1→0.1).

Deliberately NOT reconciled:

- **Constructor style the crawl can't see** (→ "only in registry", 65). The crawl
  only follows `ar`/`kr`/`ir`, so `*new`-constructed UGens are missed: demand-rate
  (`Dseq`, `Drand`, `Dwhite`, …), `PV_*`, `FFT`/`IFFT`, `Rand`/`IRand`/`ExpRand`,
  and operators (`BinaryOpUGen`, `UnaryOpUGen`, `MulAdd`).
- **sclang pseudo-UGens the primitive registry omits** (→ "only in doc", 48):
  control UGens (`Control`, `AudioControl`, `NamedControl`, `LagControl`,
  `TrigControl`), composites (`Mix`, `Splay`, `PMOsc`, `SelectX`, `LinLin`), and
  hardware I/O (`SoundIn`, `AnalogIn`, Bela `DigitalIO`).
- **`mul`/`add` tail** (~125): the doc's `.ar(…, mul, add)` includes the MulAdd
  wrapper args; scsynth applies these outside the UGen, so the registry omits them.
- **Arg-name casing** (77): SCDoc reflects the true (often all-lowercase) names
  (`delaytime`, `maxdelaytime`, `bufnum`); the registry uses Overtone's camelCase
  (`delayTime`, `buf`). The compiler matches inputs case-insensitively — cosmetic.
- **Default precision & `null` gaps** (106): all f32 rounding (`0.8` vs
  `0.800000011920929`) or `null`-vs-`0` where one source omitted a default. No
  genuine value bugs remain.

### Env — `out/env-doc.json` vs `assets/specs/envs.json`

The doc extracts **13** constructors; the spec defines **12**. `build.rs`
emits the Rust registry from it, and the TypeScript package imports it
directly as a deliberately reshaped, markup-oriented view of the doc:

- **`circle` not implemented** — the doc has it; the registry omits it (its
  loop/wrap semantics don't fit the resolve-then-build pipeline cleanly). The
  other 12 shapes match one-to-one.
- **Arg names shortened.** The doc uses SC's full names (`attackTime`,
  `decayTime`, `sustainLevel`, `releaseTime`, `peakLevel`); the registry uses the
  short forms authored for the `<sc-control>` params (`attack`, `decay`,
  `sustain`, `release`, `peak`). `sustainTime` and `bias` are unchanged.
- **`curve` is not a param.** In the doc it's a constructor argument; in the
  registry it's an `<sc-env>` attribute (a `BuildOpts` field), because
  `sc-control`'s `value` is `decimal` and can't carry a symbolic curve.
- **`releaseNode` / `loopNode` / `offset`.** The doc lists these as `new`/`step`
  arguments. The registry exposes `release-node`/`loop-node` as `<sc-env>`
  attributes and does **not** support `offset`. Conversely, the registry ADDS the
  fixed sustain node the doc signatures don't expose (they live in each
  constructor's body): adsr `2`, dadsr `3`, asr `1`, cutoff `0`.
- **Defaults match** the doc values; the registry also carries a `modulatable`
  flag per arg (not a doc concept) marking which params accept `bind:value`.

Note: the release/loop node INDICES are set inside each `Env` constructor's
_body_, not its signature, so `extract-env.mjs` cannot recover them — the
registry supplies them from the SC semantics.

### Server commands — `out/server-commands-doc.json` vs `assets/specs/server-commands.json`

The doc is grouped into sections, each with an `intro` (shared prose + a shared
arg table, e.g. the common node-notification format) and `commands` (one per
anchored `/address`, with a structured `args` table — repeating groups modelled
as `{ repeat, group }` — plus `description` and full `notes`).

Coverage: **82 of the 84** addresses represented by the spec-driven command
catalogue plus the hand-written reply accessors appear verbatim in the parsed
doc. The exceptions below are not script bugs; the bridge-only typed commands
`/dirt/play`, `/scope/subscribe`, and `/scope/unsubscribe` are intentionally
outside both the SC spec and SCDoc comparison:

- **`/rt_memoryStatus`** — the package has it, but it is not documented on the
  reference page at all (a genuine doc gap; can't extract what isn't there).
- **`/n_query.reply`** — the package's name for the reply the doc documents as
  **`/n_info`** ("Reply to /n_query"), which IS present (with the shared
  node-notification args in its section intro). Same info, different label.

Structural note: replies documented inline rather than as their own `/address`
heading are still captured — e.g. the 9-field `/status.reply` format lives in a
`<dl>` inside the `/status` command, so it lands in that command's `args` +
`description` rather than a standalone entry.
