// The foundation CSS as ONE shared constructable stylesheet. Adopt this single
// object into the document AND into any shadow root — the browser parses/stores
// it once, and adopting by reference does not copy it. This is the single
// source of foundation styles for shadow-DOM components (today just sc-select)
// and, via adoptFoundation(document), for the whole app.
//
// `undefined` only in environments without constructable-stylesheet support
// (guarded so importing this never throws under test runners).

import foundationCss from "../../../foundations/index.css?inline";

export const foundationStyles: CSSStyleSheet | undefined = (() => {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(foundationCss);
    return sheet;
  } catch {
    return undefined;
  }
})();

/** Adopt the shared foundation sheet into a document or shadow root (idempotent).
 *  Call once with `document` at app boot to style the light DOM. */
export function adoptFoundation(root: DocumentOrShadowRoot = document): void {
  if (!foundationStyles || root.adoptedStyleSheets.includes(foundationStyles)) return;
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, foundationStyles];
}
