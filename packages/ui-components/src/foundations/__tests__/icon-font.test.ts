// @vitest-environment node
//
// Regression guard for the icon font's build pipeline. The actual glyph rendering
// needs a real font engine (happy-dom has none), but the bug that bit us repeatedly
// was a BUILD one — the font not ending up in the foundation, or its woff2 left as a
// relative url() that 404s once the foundation is adopted as a constructable sheet.
//
// We run the lit-css `cssTransform` (the PostCSS pipeline: postcss-import +
// postcss-nesting + postcss-url) directly on the foundation entry — exactly what
// compiles the shipped foundation CSS. Node env: no DOM needed.

import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cssTransform } from "../../../lit-css";

// vitest runs from the package dir; resolve the foundation entry from there.
const foundationCss = resolve(process.cwd(), "src/foundations/index.css");

describe("foundation icon font (build transform)", () => {
  let css = "";
  beforeAll(async () => {
    css = await cssTransform(readFileSync(foundationCss, "utf8"), { filePath: foundationCss });
  });

  it("ships Phosphor's @font-face with the woff2 inlined as a data-URI", () => {
    expect(css).toContain("@font-face");
    expect(css).toMatch(/src:\s*url\("data:font\/woff2;base64,/);
    // No relative Phosphor woff2 may survive — it would 404 in an adopted sheet.
    expect(css).not.toMatch(/url\(["']?\.\/Phosphor[^)"']*\.woff2/);
  });

  it("includes the .ph-* glyph rules for the supported weights", () => {
    expect(css).toMatch(/\.ph-[\w-]+:+before/); // e.g. `.ph-play:before { content: … }`
    expect(css).toContain("Phosphor-Fill");
    expect(css).toContain("Phosphor-Duotone");
  });
});
