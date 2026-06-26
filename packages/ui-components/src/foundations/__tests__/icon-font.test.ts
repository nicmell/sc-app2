// @vitest-environment node
//
// Source-graph guard for the icon font wiring. The font is no longer inlined into the
// JS (it ships as separate /assets woff2 referenced by the foundation's head <link>), and
// vite-plugin-lit-css returns empty .css under vitest — so we can't assert on a compiled
// CSSResult here. Instead we pin the IMPORT GRAPH that the build relies on:
//   - the head foundation entry (index.scss) pulls in icons.scss, so the head <link> carries
//     the Phosphor @font-face (document-wide registration);
//   - icons.scss imports the three Phosphor weights whose .ph-* rules sc-icon adopts.
// "The glyph actually paints" is covered by the headless render check, not here.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// vitest runs from the package dir.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("foundation icon font (import graph)", () => {
  it("the head foundation entry pulls in the icon font", () => {
    const index = read("src/foundations/index.scss");
    expect(index).toMatch(/@use\s+["']\.\/icons["']/);
  });

  it("icons.scss imports the regular/fill/duotone Phosphor weights", () => {
    const icons = read("src/foundations/icons.scss");
    for (const weight of ["regular", "fill", "duotone"]) {
      expect(icons).toContain(`@phosphor-icons/web/${weight}/style.css`);
    }
  });

  it("the font-free shadow base does NOT pull in the icon font", () => {
    // The 1 MB font must never enter a shadow CSSResult — the shadow base components adopt
    // is reset.scss, which is fonts/icons-free.
    const reset = read("src/foundations/reset.scss");
    expect(reset).not.toContain("icons");
    expect(reset).not.toContain("@phosphor-icons");
  });
});
