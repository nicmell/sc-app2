// Shared SCSS → CSS transform for the lit-css plugins (esbuild-plugin-lit-css in
// the tsup build; rollup-plugin-lit-css in the demo Vite + the package's vitest).
// lit-css wraps the returned CSS in a Lit `css` tagged template (a CSSResult);
// we compile the SCSS (passing the file path so `@use`/partials resolve), and:
//
//  - resolve `@use "phosphor:<weight>"` to @phosphor-icons/web's weight CSS via Node
//    resolution (a custom importer — sass's NodePackageImporter doesn't pick up
//    Phosphor's plain-CSS export), so the icon font can live in the foundation SCSS;
//  - inline its `url(...woff2)` as base64 data-URIs with postcss-url, so the
//    @font-face works inside an adopted constructable stylesheet (a relative font URL
//    would 404 there).

import * as sass from "sass";
import { createRequire } from "node:module";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import postcss from "postcss";
import postcssUrl from "postcss-url";

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

/** Dirs holding the Phosphor woff2 files (next to each weight's style.css) — postcss-url's
 *  search paths, since sass flattens the @use and the url() loses its origin dir. */
const phosphorDirs = ["regular", "fill", "duotone"].map((w) =>
  path.dirname(require.resolve(`@phosphor-icons/web/${w}/style.css`)),
);

export const scssTransform = async (
  _source: string,
  { filePath }: { filePath: string },
): Promise<string> => {
  // `charset: false` so sass doesn't prepend `@charset "UTF-8";` — invalid/ignored
  // inside an adopted constructable stylesheet (and noisy in shadow CSS).
  const css = sass.compile(filePath, { charset: false, importers: [phosphorImporter] }).css;
  if (!css.includes(".woff2")) return css;
  // Inline only woff2 (the woff/ttf/svg fallbacks stay, but are never fetched since
  // woff2 is listed first and every target browser supports it). `maxSize: Infinity`
  // because the default 14 KB cap would otherwise skip the ~150 KB font files.
  const { css: out } = await postcss([
    postcssUrl({ url: "inline", filter: /\.woff2($|\?)/, basePath: phosphorDirs, maxSize: Infinity }),
  ]).process(css, { from: filePath });
  return out;
};

/** Match `.scss`. */
export const scssFilter = /\.scss$/;
