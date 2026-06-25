// The font-free shadow base as ONE shared Lit `CSSResult` (compiled from
// foundations/shadow.css by vite-plugin-lit-css). It's adopted into every shadow-DOM
// component via `static styles` — delivering the bare element styles (button/input/…)
// + reset that shadow internals need. Tokens reach the shadow via custom-property
// inheritance from the document; the icon font lives in the head, not here.
//
// The FULL foundation (tokens + themes + reset + elements + typography + the Phosphor
// @font-face + .ph-* rules, woff2 as separate /assets files) ships as a render-blocking
// <link> in the document <head> — a side-effect `import "@sc-app/ui-components"` in the
// app/example entries (Vite extracts it to the head in the production build). That head
// sheet styles the light DOM + the app shell and registers the font document-wide, so
// there is no adoptFoundation() and no runtime style adoption onto the document.

import type { CSSResult } from "lit";
import shadowSheet from "../../foundations/shadow.css";
import controlsSheet from "../../foundations/base/controls.css";

// Explicitly typed (not a bare re-export of the `.css` import) so the emitted
// `.d.ts` reads `export const foundations: CSSResult` with no `.css` edge for
// the dts bundler / consumers to resolve.
export const foundations: CSSResult = shadowSheet;

// The bare form-field chrome (input/select/textarea surface/border/focus). NOT in the
// shared `foundations` base — only the three components that render a native field in
// their shadow adopt it: sc-input, sc-inputnumber, sc-textarea. The same sheet feeds the
// head foundation via base/elements.css's @import. (sc-disclosure styles its own summary.)
export const controlStyles: CSSResult = controlsSheet;
