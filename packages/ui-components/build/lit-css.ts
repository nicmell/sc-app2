// Shared SCSS → CSS transform for the lit-css plugins (esbuild-plugin-lit-css in
// the tsup build; rollup-plugin-lit-css in the demo Vite + the package's vitest).
// lit-css wraps the returned CSS in a Lit `css` tagged template (a CSSResult);
// we compile the SCSS (passing the file path so `@use`/partials resolve), and:
//
//  - resolve `@use "phosphor:<weight>"` to @phosphor-icons/web's weight CSS via Node
//    resolution (a custom importer — sass's NodePackageImporter doesn't pick up
//    Phosphor's plain-CSS export), so the icon font can live in the foundation SCSS;
//  - inline its `url(...woff2)` as base64 data-URIs, so the @font-face works inside
//    an adopted constructable stylesheet (a relative font URL would 404 there).

import * as sass from "sass";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

/** Maps `phosphor:<weight>` → @phosphor-icons/web's compiled weight CSS file, resolved
 *  through the package's exports exactly as the app resolves it. */
const phosphorImporter: sass.FileImporter<"sync"> = {
  findFileUrl(url) {
    if (!url.startsWith("phosphor:")) return null;
    const weight = url.slice("phosphor:".length);
    return pathToFileURL(require.resolve(`@phosphor-icons/web/${weight}/style.css`));
  },
};

/** Dirs holding the Phosphor woff2 files (next to each weight's style.css). */
const phosphorDirs = ["regular", "fill", "duotone"].map((w) =>
  path.dirname(require.resolve(`@phosphor-icons/web/${w}/style.css`)),
);

/** Inline `url(...woff2)` as base64 data-URIs (woff2 only — the woff/ttf/svg fallbacks
 *  stay but are never fetched, since woff2 is listed first and every target browser
 *  supports it). Lets the icon @font-face live inside the adopted foundation sheet. */
function inlineWoff2(css: string): string {
  return css.replace(/url\((['"]?)([^'")]+\.woff2)\1\)/g, (whole, _q: string, ref: string) => {
    const base = path.basename(ref);
    for (const dir of phosphorDirs) {
      const file = path.join(dir, base);
      if (existsSync(file)) {
        return `url("data:font/woff2;base64,${readFileSync(file).toString("base64")}")`;
      }
    }
    return whole;
  });
}

export const scssTransform = (_source: string, { filePath }: { filePath: string }): string => {
  // `charset: false` so sass doesn't prepend `@charset "UTF-8";` — invalid/ignored
  // inside an adopted constructable stylesheet (and noisy in shadow CSS).
  const css = sass.compile(filePath, { charset: false, importers: [phosphorImporter] }).css;
  return css.includes(".woff2") ? inlineWoff2(css) : css;
};

/** Match `.scss`. */
export const scssFilter = /\.scss$/;
