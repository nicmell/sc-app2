// Icon-font bridge for shadow DOM. The Phosphor glyph rules (`.ph-*` selectors +
// @font-face) live in document stylesheets, which can't reach an element inside a
// shadow root. <sc-icon-base> is shadow DOM, so it adopts the font into its own
// shadow.
//
// The package bundles Phosphor itself (a regular dependency) at fixed weights —
// regular | fill | duotone, the ones the `variant` prop supports. We import each
// weight's CSS as a string (`?inline`) and build ONE shared constructable sheet,
// adopted by reference into every icon's shadow. No runtime DOM scanning, no host
// setup: just render <sc-icon-base> and the glyph shows.
//
// `null` only where constructable stylesheets are unavailable (e.g. happy-dom in
// tests) — guarded so importing this never throws and adoptIconFont() is a no-op.

import regular from "@phosphor-icons/web/regular/style.css?inline";
import fill from "@phosphor-icons/web/fill/style.css?inline";
import duotone from "@phosphor-icons/web/duotone/style.css?inline";

const iconSheet: CSSStyleSheet | null = (() => {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(regular + "\n" + fill + "\n" + duotone);
    return sheet;
  } catch {
    return null;
  }
})();

/** Adopt the bundled Phosphor glyph rules into a shadow root (idempotent). */
export function adoptIconFont(root: ShadowRoot): void {
  if (iconSheet && !root.adoptedStyleSheets.includes(iconSheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, iconSheet];
  }
}
