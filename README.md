# sc-app2

A desktop/browser app for controlling SuperCollider (scsynth) and Strudel
through a Rust OSC bridge. Tauri 2 (Rust backend) + React 19 + Lit 3 web
components. Plugins are zips of spec-validated XHTML built from `sc-*`
elements, bound to live scsynth node graphs, with in-browser SynthDef
compilation.

## Quick start

```bash
yarn                 # install
yarn osc             # scsynth + sclang/StrudelDirt (pre-req: setup-deps once)
yarn dev:full        # frontend (:1420) + headless Rust server (:3000)
yarn tauri dev       # or: the full native app
```

## Docs

- `CLAUDE.md` — the architecture + working reference (start here)
- `architecture.md` — backend deep-dive; `scope.md` — the SHM scope pipeline;
  `CLOCK.md` — the bridge clock
- `src/sc-elements/README.md` — per-element docs;
  `src/lib/osc/README.md` — the OSC endpoint
- `examples/README.md` — the example plugins (also the acceptance suite)

## Testing

```bash
yarn test    # unit (vitest, happy-dom)
yarn e2e     # full stack on a throwaway app root (yarn smoke = boot only)
cd src-tauri && cargo test
```
