// Icon-font bridge for shadow DOM. The Phosphor icon font (`@phosphor-icons/web`)
// ships its `.ph-*` glyph rules as a DOCUMENT stylesheet, which can't reach an
// element inside a shadow root. <sc-icon-base> is shadow DOM, so it adopts those
// rules into its own shadow: we snapshot the document stylesheet(s) that define
// the Phosphor rules into one constructable sheet (cached, built lazily so it
// works even if the font CSS loads after the first icon), and adopt it.
//
// If the font CSS isn't present (e.g. headless tests), this is a no-op — the icon
// still renders its <i class="ph-fill ph-<name>">, just without the glyph.

let iconSheet: CSSStyleSheet | null = null;

// Match a Phosphor rule: a `.ph` / `.ph-…` selector rule, or the Phosphor
// @font-face. Deliberately narrow so that a bundler which merges all CSS into a
// single document stylesheet can't leak unrelated app rules into the icon shadow.
function isIconRule(text: string): boolean {
  if (/(^|[\s,>+~}{])\.ph[-.:[\s{]/.test(text)) return true;
  return /@font-face/i.test(text) && /phosphor/i.test(text);
}

function buildIconSheet(): CSSStyleSheet | null {
  if (iconSheet) return iconSheet;
  try {
    const chunks: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet — can't read
      }
      for (const rule of Array.from(rules)) {
        if (isIconRule(rule.cssText)) chunks.push(rule.cssText);
      }
    }
    if (!chunks.length) return null;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(chunks.join("\n"));
    iconSheet = sheet;
  } catch {
    return null;
  }
  return iconSheet;
}

/** Adopt the Phosphor glyph rules into a shadow root (idempotent, lazy). */
export function adoptIconFont(root: ShadowRoot): void {
  const sheet = buildIconSheet();
  if (sheet && !root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}
