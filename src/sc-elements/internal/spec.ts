// The runtime spec surface. The AUTHORED source of truth is the sc-validate
// crate's specs/<tag>.spec.json files; the frontend reads the map out of the
// wasm module via @sc-app/validate's getSpec (parsed once at initValidator).
// This module keeps the two frontend-side constants and re-exports the types.

export { getSpec, type AttrSpec, type ElementSpec } from "@sc-app/validate";

/** The runtime-prop attribute namespace prefix: `bind:min="vars.lo"` is the
 *  dynamic sibling of `min`. Entries declare `xmlns:bind="urn:sc-app:bind"`
 *  once on the root (required for Chrome's namespace-strict text/xml parse);
 *  the RUNTIME matches by QUALIFIED NAME (`bind:` prefix, canonical — the
 *  portable API across happy-dom and the browser); WHICH bind:* names are
 *  legal is the shared static validator's job. */
export const bindAttr = (name: string): string => `bind:${name}`;

/** The attributes every element accepts without declaring them: the shared
 *  static validator's unknown-attribute allowance (the crate's COMMON_ATTRS)
 *  and the content-hash skip-list. ONE set, two gates. */
export const COMMON_ATTRS = new Set(["id", "class", "title", "style"]);
