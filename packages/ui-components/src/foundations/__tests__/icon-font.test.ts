// @vitest-environment node
//
// Regression guard for the icon font's build pipeline. The actual glyph rendering needs
// a real font engine (happy-dom has none), but the bug that bit us repeatedly was a BUILD
// one — the Phosphor woff2 left as a relative url() / unresolved Vite asset placeholder
// that 404s once the foundation is adopted as a constructable sheet.
//
// At build/dev the foundation runs through Vite's CSS pipeline (Vite inlines the @imports)
// + the shipped repo-root postcss.config.cjs (postcss-url woff2 → data-URI). vite-plugin-
// lit-css doesn't transform .css under vitest, so we run that SAME shipped config directly
// on Phosphor's actual @font-face source — the exact rule that must come out self-contained.

import { describe, expect, it, beforeAll } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const require = createRequire(import.meta.url);
// vitest runs from the package dir; the shipped pipeline lives at the repo root.
const { plugins } = require(resolve(process.cwd(), "../../postcss.config.cjs")) as {
  plugins: postcss.AcceptedPlugin[];
};

describe("foundation icon font (build transform)", () => {
  let css = "";
  beforeAll(async () => {
    const entry = require.resolve("@phosphor-icons/web/regular/style.css");
    css = (await postcss(plugins).process(readFileSync(entry, "utf8"), { from: entry })).css;
  });

  it("inlines Phosphor's @font-face woff2 as a data-URI", () => {
    expect(css).toContain("@font-face");
    expect(css).toMatch(/src:\s*url\(["']?data:font\/woff2;base64,/);
    // No relative woff2 may survive — it would 404 in an adopted constructable sheet.
    expect(css).not.toMatch(/url\(["']?\.\/[^)"']*\.woff2/);
  });

  it("keeps the .ph-* glyph rules", () => {
    expect(css).toMatch(/\.ph[.-][\w-]+:+before/); // e.g. `.ph.ph-play:before { content: … }`
  });
});
