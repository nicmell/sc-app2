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

## Why the doc data differs from the committed registry

The committed `packages/synthdef-compiler` specs came from an **Overtone** dump;
this crawl is from **SCDoc HTML**. Both describe the same UGens but diverge — see
`out/ugens-diff.md` for the full classification.

`reconcile-ugens.mjs` has been applied: the **rate lists** were aligned to the
doc (0 mismatches remain) and the **8 genuine default-value bugs** fixed
(`Convolution2/2L/3` + `StereoConvolution2L` framesize 512→2048, `Spring.spring`
0→1, `GrainBuf.pos` 1→0, `Warp1.windowSize` 0.1→0.2, `PSinGrain.amp` 1→0.1) in
both specs and builders. The remaining, deliberately-unreconciled differences:

- **Constructor style the crawl can't see.** The crawl only follows `ar`/`kr`/`ir`
  class methods, so UGens constructed via `*new` are missed: the demand-rate
  family (`Dseq`, `Drand`, `Dwhite`, …), the `PV_*` FFT UGens, `FFT`/`IFFT`,
  `Rand`/`IRand`/`ExpRand`, and the operator UGens (`BinaryOpUGen`,
  `UnaryOpUGen`, `MulAdd`). These make up almost all of "only in registry".
- **sclang pseudo-UGens the primitive registry omits.** "Only in doc" is mostly
  sclang-level wrappers/composites, not scsynth primitives: control UGens
  (`Control`, `AudioControl`, `NamedControl`, `LagControl`, `TrigControl`),
  composites (`Mix`, `Splay`, `PMOsc`, `SelectX`, `LinLin`), and hardware I/O
  (`SoundIn`, `AnalogIn`, Bela `DigitalIO`).
- **`mul`/`add` tail.** The doc's `.ar(…, mul, add)` signature includes the
  MulAdd wrapper args; scsynth applies these outside the UGen, so the registry
  omits them (~125 UGens).
- **Arg-name casing.** SCDoc reflects the true (often all-lowercase) arg names
  (`delaytime`, `maxdelaytime`, `bufnum`); the registry uses Overtone's
  camelCase (`delayTime`, `buf`). The compiler matches inputs case-insensitively,
  so this is cosmetic.
- **Default precision & `null` gaps.** Most default-value diffs are f32 rounding
  (`0.8` vs `0.800000011920929`) or a `null`-vs-`0` where one source omitted a
  default. A few are genuine (e.g. `Convolution2.framesize` doc `2048` vs reg
  `512`) and worth reconciling.
