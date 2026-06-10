// Strudel global setup.
//
// StrudelMirror's evaluator runs user code with a `Function`, so the pattern
// builders (`s`, `note`, `sound`, scales, mini-notation) must live on the
// global scope. `evalScope` loads them there. We pull in core + mini + tonal
// only — NOT @strudel/web's superdough, since our output is OSC, not WebAudio.

import { evalScope } from "@strudel/core";

let ready: Promise<unknown> | null = null;

/** Idempotently expose Strudel's builders globally (awaited before eval). */
export function ensureStrudelGlobals(): Promise<unknown> {
  if (!ready) {
    ready = evalScope(
      import("@strudel/core"),
      import("@strudel/mini"),
      import("@strudel/tonal"),
    );
  }
  return ready;
}
