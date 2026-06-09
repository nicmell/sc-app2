/// <reference lib="webworker" />
// OSC worker entry point (browser): build a MessageEndpoint over `self` and run
// the shared worker runtime.

import { runOscWorker } from "./oscWorkerMain";

// osc-js (lib/osc.js:204) reads `typeof global !== 'undefined' ? global : window`
// at decode time; in a Worker both are undefined, so alias `window` to the global
// scope. Only needed before the first decode (a later task), so inlining here —
// after the osc-js import, which itself touches only `globalThis` — is in time.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  (globalThis as { window?: unknown }).window = globalThis;
}

runOscWorker({
  postMessage: (msg, transfer) => self.postMessage(msg, transfer ?? []),
  onMessage: (handler) => {
    const l = (e: MessageEvent) => handler(e.data);
    self.addEventListener("message", l);
    return () => self.removeEventListener("message", l);
  },
});
