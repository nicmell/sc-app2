// Strudel global setup.
//
// StrudelMirror's evaluator runs user code with a `Function`, so the pattern
// builders (`s`, `note`, `sound`, scales, mini-notation) must live on the
// global scope. `evalScope` loads them there. We pull in core + mini + tonal
// only — NOT @strudel/web's superdough, since our output is OSC, not WebAudio.

let ready: Promise<unknown> | null = null;

/** Idempotently expose Strudel's builders globally (awaited before eval). The
 *  @strudel/* packages are dynamically imported so they stay out of the boot
 *  bundle — this only runs when a <sc-strudel> editor first evaluates. The
 *  promise is cached synchronously, so concurrent callers share one load. */
export function ensureStrudelGlobals(): Promise<unknown> {
  if (!ready) {
    ready = import("@strudel/core").then(({ evalScope }) =>
      evalScope(import("@strudel/core"), import("@strudel/mini"), import("@strudel/tonal")),
    );
  }
  return ready;
}
