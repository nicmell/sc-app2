// The foundation as constructable stylesheets, in layers, so a shadow adopts
// only what it can actually use:
//   - tokens     (tokens.css) — design tokens + theme palette. Lives on the
//     DOCUMENT: `:root` doesn't match inside a shadow, and custom properties
//     inherit across the boundary, so document tokens resolve in every shadow.
//   - shell      (shell.css)  — reset + bare interactive/form element styles a
//     component needs in its own shadow. This is the shared `foundations` sheet
//     every component adopts via `static styles = [foundations, styles]`.
//   - typography (base/typography.css) — headings/p/code/a. DOCUMENT only: never
//     rendered inside a shadow (slotted content is light DOM), so it's not in the
//     per-shadow `foundations`; adoptFoundation() adds it for the app shell.
//
// Components self-bootstrap the token layer onto the document (see ensureTokens +
// the module-load call below), so `var(--…)` resolves even when the consumer
// never calls adoptFoundation(). Adopting the token layer is safe — it imposes
// no reset, only custom-property definitions.
//
// `undefined` only in environments without constructable-stylesheet support
// (guarded so importing this never throws under test runners).

import { css, type CSSResultOrNative } from "lit";
import tokensCss from "../../foundations/tokens.css?inline";
import shellCss from "../../foundations/shell.css?inline";
import typographyCss from "../../foundations/base/typography.css?inline";

function build(text: string): CSSStyleSheet | undefined {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    return sheet;
  } catch {
    return undefined;
  }
}

const tokensSheet = build(tokensCss);
const shellSheet = build(shellCss);
const typographySheet = build(typographyCss);

function adopt(sheet: CSSStyleSheet | undefined, root: DocumentOrShadowRoot): void {
  if (!sheet || root.adoptedStyleSheets.includes(sheet)) return;
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/** Reset + bare element styles — the shared sheet every component adopts into
 *  its shadow (`static styles = [foundations, styles]`). Always a valid entry. */
export const foundations: CSSResultOrNative = shellSheet ?? css``;

/** Put the design tokens on a document (or shadow) root (idempotent). Components
 *  call this on connect so `var(--…)` resolves standalone, with NO reset
 *  imposed — it only defines custom properties + the theme selectors. */
export function ensureTokens(root: DocumentOrShadowRoot = document): void {
  adopt(tokensSheet, root);
}

/** Adopt the FULL foundation (tokens + reset + base elements + typography) onto a
 *  document — for the light-DOM app shell + slotted content. Call once at boot.
 *  (Reuses the same sheet objects as the components, so it's idempotent with
 *  ensureTokens / shadow adoption.) */
export function adoptFoundation(root: DocumentOrShadowRoot = document): void {
  adopt(tokensSheet, root);
  adopt(shellSheet, root);
  adopt(typographySheet, root);
}

// Self-bootstrap: importing any component (which imports this module) puts the
// token layer on the document, so components render with resolved tokens even
// without an explicit adoptFoundation() call. Guarded for non-DOM/SSR.
if (typeof document !== "undefined" && "adoptedStyleSheets" in document) {
  ensureTokens(document);
}
