// Shared SCSS → CSS transform for the lit-css plugins (esbuild-plugin-lit-css in
// the tsup build; rollup-plugin-lit-css in the demo Vite + the package's vitest).
// lit-css wraps the returned CSS in a Lit `css` tagged template (a CSSResult);
// we just compile the SCSS — passing the file path so `@use`/partials resolve.

import * as sass from "sass";

export const scssTransform = (_source: string, { filePath }: { filePath: string }): string =>
  // `charset: false` so sass doesn't prepend `@charset "UTF-8";` — invalid/ignored
  // inside an adopted constructable stylesheet (and noisy in shadow CSS).
  sass.compile(filePath, { charset: false }).css;

/** Match `.scss` (NOT `.css?inline` — that stays the Phosphor external import). */
export const scssFilter = /\.scss$/;
