// Global test stub for @strudel/core (aliased in vite.config.ts `test.alias`).
// lib/strudel/prebake statically imports `evalScope` from it, and the real
// package transitively pulls in @kabelsalat/web (no happy-dom resolution).
// prebake's evalScope only runs when the editor calls its prebake hook, which
// the stubbed StrudelMirror never does — so an inert export is enough.

export const evalScope = async (..._modules: unknown[]): Promise<undefined> => undefined;
