// @vitest-environment node
//
// Source-graph guard for the icon font wiring. The font is no longer inlined into the
// JS (it ships as separate /assets woff2 referenced by the foundation's head <link>), and
// vite-plugin-lit-css returns empty .css under vitest — so we can't assert on a compiled
// CSSResult here. Instead we pin the IMPORT GRAPH that the build relies on:
//   - the head foundation entry (index.css) pulls in icons.css, so the head <link> carries
//     the Phosphor @font-face (document-wide registration);
//   - icons.css imports the three Phosphor weights whose .ph-* rules sc-icon adopts.
// "The glyph actually paints" is covered by the headless render check, not here.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// vitest runs from the package dir.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("foundation icon font (import graph)", () => {
  it("the head foundation entry pulls in the icon font", () => {
    const index = read("src/foundations/index.css");
    expect(index).toMatch(/@import\s+["']\.\/icons\.css["']/);
  });

  it("icons.css imports the regular/fill/duotone Phosphor weights", () => {
    const icons = read("src/foundations/icons.css");
    for (const weight of ["regular", "fill", "duotone"]) {
      expect(icons).toContain(`@phosphor-icons/web/${weight}/style.css`);
    }
  });

  it("the font-free shadow base does NOT pull in the icon font", () => {
    // The 1 MB font must never enter a shadow CSSResult — shadow.css is fonts/icons-free.
    const shadow = read("src/foundations/shadow.css");
    expect(shadow).not.toContain("icons.css");
    expect(shadow).not.toContain("@phosphor-icons");
  });
});
