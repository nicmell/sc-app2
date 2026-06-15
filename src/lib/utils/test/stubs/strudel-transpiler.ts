// Global test stub for @strudel/transpiler (aliased in vite.config.ts
// `test.alias`). The real package transitively imports @kabelsalat/web, which
// doesn't resolve under happy-dom. sc-strudel only hands `transpiler` to the
// (stubbed) editor, which never calls it here.

export const transpiler = () => undefined;
