# SCDoc scrapers

Reproducible extraction of SuperCollider class metadata from the official docs
at [doc.sccode.org](https://doc.sccode.org), used to seed / cross-check the
`@sc-app/synthdef-compiler` registries. Raw HTML is cached under `.cache/`
(gitignored); extracted data lands in `out/` (committed).

| script | command | output |
| --- | --- | --- |
| `extract-env.mjs` | `yarn scdoc:env` | `out/env-doc.json` — every `Env` class-method constructor (params + defaults + arg docs) |
| `extract-ugens.mjs` | `yarn scdoc:ugens` | `out/ugens-doc.json` — one entry per standard UGen with an `ar`/`kr`/`ir` constructor (name, rates, defaults, argDocs) |
| `diff-ugens.ts` | `yarn scdoc:diff` | `out/ugens-diff.md` — the crawl vs the committed registry |
| `reconcile-ugens.mjs` | `node scripts/scdoc/reconcile-ugens.mjs` | edits the specs + builders in place to the doc's rates + genuine defaults (idempotent) |

The UGen class list + categories come from the site's `docmap.js` (the
machine-readable index behind `Browse.html#UGens`); each class page supplies the
method signatures. `lib.mjs` holds the shared HTML/docmap parsing.

## Generated output vs the committed registry

The extracted `out/*.json` come from **SCDoc HTML**; the committed registries
are the compiler's source of truth (UGens from an **Overtone** dump, envelopes
hand-authored). They are aligned where it matters but **not identical** — the
remaining differences below are intentional, not bugs.

### UGens — `out/ugens-doc.json` vs `packages/synthdef-compiler/src/specs`

Full classification in `out/ugens-diff.md` (regenerate with `yarn scdoc:diff`).
Current state: **302** in common, **48** only in doc, **65** only in registry,
**0** rate mismatches, **77** arg-name diffs, **106** default-value diffs.

Reconciled by `reconcile-ugens.mjs` (specs + builders): the **rate lists** (45
mismatches → 0) and the **8 genuine default bugs** (`Convolution2/2L/3` +
`StereoConvolution2L` framesize 512→2048, `Spring.spring` 0→1, `GrainBuf.pos`
1→0, `Warp1.windowSize` 0.1→0.2, `PSinGrain.amp` 1→0.1).

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

### Env — `out/env-doc.json` vs `packages/synthdef-compiler/src/env-registry.ts`

The doc extracts **13** constructors; the registry implements **12**. The
registry is deliberately a reshaped, markup-oriented view of the doc:

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
