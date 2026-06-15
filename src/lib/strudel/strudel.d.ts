// Type shims for the @strudel/* packages, which ship JS-only bundles with
// no TypeScript declarations. We only declare the surface we use.

declare module "@strudel/codemirror" {
  export class StrudelMirror {
    constructor(opts: {
      root: HTMLElement;
      initialCode?: string;
      defaultOutput?: (...args: any[]) => unknown;
      getTime?: () => number;
      transpiler?: (code: string) => { output: string };
      prebake?: () => Promise<void>;
      bgFill?: boolean;
      solo?: boolean;
      onToggle?: (started: boolean) => void;
      onEvalError?: (err: Error) => void;
      afterEval?: (result: unknown) => void;
      [key: string]: unknown;
    });
    evaluate(start?: boolean): Promise<void>;
    stop(): Promise<void>;
    clear(): void;
    code: string;
  }
}

declare module "@strudel/transpiler" {
  export function transpiler(code: string): { output: string };
}

declare module "@strudel/core" {
  /** Loads the given module namespaces into the global eval scope so REPL
   *  code can reference `s`, `note`, scales, etc. */
  export function evalScope(...modules: unknown[]): Promise<unknown>;
}

declare module "@strudel/mini";
declare module "@strudel/tonal";
