# scserver-commands vs osc-js — browser benchmark

Historical browser harness for comparing `scserver-commands` OSC
**encode** (command → wire bytes) and **decode** (wire bytes → reply)
throughput against [`osc-js`](https://github.com/adzialocha/osc-js)
(pure JS). Its source and package scripts still target the retired binding
surface and must be migrated before it can run against the current
wasm-bindgen package.

The intended current coverage is every known server command (all 67
address-tagged variants, including the 6 arg-less commands and 3 bridge
extensions) plus the `other` escape hatch for encode, and every documented
reply for decode.

Three modes:

- **Single message** — one WASM crossing per message. osc-js wins here;
  the fixed JS↔WASM boundary cost dominates tiny payloads.
- **OSC bundle** (`encodeBundle` / `decodeBundle`) — each message wrapped
  in its own single-message bundle, one crossing per message. Lands ≈ a
  wash: osc-js's Bundle-object overhead offsets scserver's boundary tax.
- Headless runners: `npm run bench:node` (single message), `bench:batch`
  (length-framed batch, all-in-one), `bench:bundle` (one OSC bundle per
  message) — Node/V8, for a number when no browser is handy.

## How the comparison is kept fair

- **Encode.** Both sides serialise an in-memory message to OSC bytes.
  The osc-js message is derived from scserver's own output, so the two
  encode *byte-identical* payloads — the `equiv` column asserts it.
  Note scserver.encode does strictly more per call: it lowers the typed
  command shape into flat OSC args, whereas osc-js packs args that are
  already flat.
- **Decode.** `scserver.replies.decode` parses OSC **and** classifies
  into a typed reply record; osc-js only parses to a generic message.
  scserver therefore does more work per call — the raw ops/sec is not a
  like-for-like OSC-parse comparison.
- **NRT.** scserver emits the full length-framed NRT command file;
  osc-js has no NRT format, so its column packs one OSC `Bundle` per
  timestamp (framing excluded) — shown for scale only.

The harness (`src/bench.ts`) warms up each case, then runs timed batches
until a wall-clock budget elapses, feeding a `sink` value back to defeat
dead-code elimination.

## Files

- `src/samples.ts` — one typed payload per command + reply arg lists.
- `src/bench.ts`   — adaptive micro-benchmark timer.
- `src/main.ts`    — orchestration, byte-equivalence checks, rendering.
