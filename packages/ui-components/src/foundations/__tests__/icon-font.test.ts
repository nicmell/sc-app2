// @vitest-environment node
//
// Runs in node (not happy-dom): this exercises the build transform — sass + the
// `phosphor:` FileImporter — and happy-dom's global `URL` override makes sass reject
// the importer's `pathToFileURL` result ("must return a URL"). No DOM is needed here.
//
// Regression guard for the icon font's build pipeline. The actual glyph rendering
// needs a real font engine (happy-dom has none), but the bug that bit us repeatedly
// was a BUILD one — the font not ending up in the foundation, or its woff2 left as a
// relative url() that 404s once the foundation is adopted as a constructable sheet.
//
// We exercise the lit-css `scssTransform` directly (rather than the `.scss` import,
// which vitest resolves differently than the real build) — it's exactly what compiles
// the shipped foundation CSS, including the `phosphor:` sass importer + postcss-url.

import { beforeAll, describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { scssTransform } from "../../../lit-css";

// vitest runs from the package dir; resolve the foundation entry from there.
const foundationScss = resolve(process.cwd(), "src/foundations/index.scss");

describe("foundation icon font (build transform)", () => {
  let css = "";
  beforeAll(async () => {
    css = await scssTransform("", { filePath: foundationScss });
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
