// Global test stub for @strudel/codemirror (aliased in vite.config.ts
// `test.alias`). The real package is the CodeMirror-based editor — a
// browser-only module that won't import under happy-dom — and the parse engine
// never drives it. The stub records every constructed instance so suites that
// need to assert on the editor (widgets.test.ts) can read `strudelMirrors`
// without a per-file mock; suites that don't (examples/controls) just ignore it.

import { vi } from "vitest";

export interface StrudelMirrorStub {
  opts: Record<string, any>;
  code: string;
  editor: { state: { doc: { toString: () => string } } };
  stop: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  setCode: ReturnType<typeof vi.fn>;
  repl: { scheduler: { cps: number; setCps: (cps: number) => void } };
}

/** Every StrudelMirror constructed during the current test file, in order.
 *  Reset it in beforeEach (`strudelMirrors.length = 0`) where it's asserted. */
/** A live-ish scheduler fake: setCps stores the value (the wrap and
 *  the conductor freeze/restore tests read it back). */
function makeScheduler() {
  const scheduler = {
    cps: 0.5,
    setCps: vi.fn((cps: number) => {
      scheduler.cps = cps;
    }),
  };
  return scheduler;
}

export const strudelMirrors: StrudelMirrorStub[] = [];

export class StrudelMirror implements StrudelMirrorStub {
  opts: Record<string, any>;
  code: string;
  editor: { state: { doc: { toString: () => string } } };
  stop = vi.fn();
  clear = vi.fn();
  evaluate = vi.fn();
  setCode = vi.fn((code: string) => {
    this.code = code;
  });
  repl = { scheduler: makeScheduler() };
  constructor(opts: Record<string, any>) {
    this.opts = opts;
    this.code = opts.initialCode ?? "";
    this.editor = { state: { doc: { toString: () => this.code } } };
    strudelMirrors.push(this);
  }
}
