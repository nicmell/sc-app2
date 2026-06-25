// The foundation CSS as ONE shared Lit `CSSResult` (compiled from
// foundations/index.css by the lit-css build/dev plugin). It's adopted into
// every shadow-DOM component (via the shared `foundations` export in
// `static styles`) AND, through adoptFoundation(document), onto the app shell —
// the browser parses/stores the underlying sheet once and adopts it by reference.

import type { CSSResult } from "lit";
import foundationSheet from "../../foundations/index.css";

// Explicitly typed (not a bare re-export of the `.css` import) so the emitted
// `.d.ts` reads `export const foundations: CSSResult` with no `.css` edge for
// the dts bundler / consumers to resolve.
export const foundations: CSSResult = foundationSheet;

/** Adopt the shared foundation sheet into a document or shadow root (idempotent).
 *  Call once with `document` at app boot to style the light DOM. Guarded for
 *  environments without constructable stylesheets (e.g. happy-dom under tests). */
export function adoptFoundation(root: DocumentOrShadowRoot = document): void {
  const sheet = foundations.styleSheet;
  if (!sheet || root.adoptedStyleSheets.includes(sheet)) return;
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}
