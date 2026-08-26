# scripts/e2e — design decisions

How to run it (`yarn e2e` / `yarn smoke` / suite selection / `--attach`) is
in the root CLAUDE.md ("Validating example plugins") and `run.mjs`'s header.
This file records the WHY behind the framework's non-obvious choices, so
they survive the next rewrite.

## Layout

```
run.mjs             entry: package zips, boot or attach, run suites, verdict
stack.mjs           bootStack/attachStack/teardown — every process this
                    framework owns
cdp.mjs             the one CDP client (Tab, findOrCreateTab, freshTab, js())
suites/boot.mjs     the app's own boot story in a real browser
suites/examples.mjs upload + runtime gates over the packaged examples
```

A suite exports `run(ctx) → [{name, ok, detail}]`. A thrown suite becomes a
failed row and the remaining suites still run — each suite is independent
evidence, one crash must not hide the others' results.

## Owned mode: the throwaway root

`bootStack()` spawns the whole stack (serve, vite, scsynth via start-osc.sh,
headless Chrome) against a tempdir `SC_APP_DIR`. Nothing touches `appdir/`
or the canonical platform root, so back-to-back runs are idempotent and
there is no cleanup pass — the root is disposable by construction.

**UDP-57110 pre-flight refusal**: if something is already bound on scsynth's
port, the run REFUSES to start instead of silently adopting a developer's
own scsynth (serve would register against it and the teardown could never
distinguish ours from theirs).

## Attach mode

`--attach` reuses an already-running dev stack for fast iteration. Two
invariants:

- **Health checks must not mutate.** Attach probes `GET /api/diag/nodetree`
  (a real /g_queryTree round-trip) — a session mint would leak a WS-less
  live session into the attached server.
- **Uploads replace, never delete.** `add_plugin` dedupes on name+version,
  so re-uploading an example REPLACES it in place — attach runs are
  idempotent without a cleanup pass. A delete-based cleanup was tried and
  removed: it deleted the developer's own synced plugins (same names).

## Teardown: scoped group kills, no pkill

`teardown()` kills the process GROUPS it spawned, in reverse order
(TERM → bounded wait → KILL), and nothing else. start-osc.sh's
non-interactive bash keeps scsynth+sclang in its own pgid and yarn/vite/
cargo children inherit theirs, so the group kill IS the scoped kill. A
blanket `pkill scsynth` would kill a developer's own server — never add one.

## freshTab and the 409 session-busy race

The stored session id is per-origin localStorage, shared across tabs. A
stale tab (or a stale stored id under a dying socket) revives the old
session and the fresh boot gets a 409. `freshTab()` closes every app tab,
navigates to `/@vite/client` (same-origin JS served as text — no app boot),
clears storage, and hands back the parked tab. The boot suite runs it
unconditionally (the examples suite reuses a tab via findOrCreateTab —
its probes don't boot the app); in attach mode it is what makes boot
assertions deterministic.

## Assertion philosophy

Boot-suite assertions are POLLS with deadlines and deliberately coarse
(presence, regex — never exact copy strings), so UI copy changes don't rot
the suite. The examples suite is the opposite: its PASS/FAIL expectation sets mirror
examples/README.md's tables, and the runtime probe body is the verbatim
parseEntry + processRoot sequence. Byte-exact error-message pinning is the
UNIT gate's job (src/sc-elements/__tests__/examples.test.ts).

Interpolate values into `Runtime.evaluate` expressions with `js()`
(JSON.stringify), never raw template strings.
