// The frontend surface of the shared Rust static validator (the sc-validate
// crate compiled by `yarn generate:wasm` into pkg/). Two exports: the memoized
// async `initValidator` (awaited once at boot / test setup) and the sync
// `validateEntry` — the whole static gate: wasm-validate the entry text
// (multi-error, newline-joined), then DOMParser-parse it and return the live
// document element. Bind/reference resolution stays in the parse engine.

import init, { validate_entry } from "../pkg/sc_validate";

let ready: Promise<void> | undefined;
let initialized = false;

/** Instantiate the wasm module once (subsequent calls join the first).
 *  Without an argument the glue fetches pkg/sc_validate_bg.wasm relative to
 *  its own URL (the Vite asset path); tests pass the bytes directly. */
export function initValidator(input?: BufferSource): Promise<void> {
  ready ??= (input === undefined ? init() : init({ module_or_path: input })).then(() => {
    initialized = true;
  });
  return ready;
}

/** Validate + parse a plugin entry document. Throws the canonical shapes:
 *  `plugin entry is not valid XHTML: …` on a parse failure, else every spec
 *  violation newline-joined (a single violation is byte-identical to the old
 *  per-element engine error). Returns the authored root element. */
export function validateEntry(xml: string): Element {
  if (!initialized) {
    throw new Error("sc-validate is not initialized — await initValidator() first");
  }
  let violations: string[];
  try {
    violations = validate_entry(xml);
  } catch (e) {
    throw new Error(`plugin entry is not valid XHTML: ${String(e)}`, { cause: e });
  }
  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
  // The wasm side already proved well-formedness; this parse only exists to
  // produce the live Element (the parsererror probe is a defensive fallback
  // for DOM-parser/roxmltree divergence).
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`plugin entry is not valid XHTML: ${parseError.textContent}`);
  }
  return doc.documentElement;
}
