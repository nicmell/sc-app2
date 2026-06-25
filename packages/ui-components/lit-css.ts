// PostCSS pipeline used by the foundation/icon-font regression test. The app, the
// example, and vitest compile this package's `.css` to Lit CSSResults via
// `vite-plugin-lit-css`, which patches Vite's `css-post` plugin so Vite's own CSS
// pipeline runs first — including the repo-root `postcss.config.cjs` (postcss-import for
// the foundation partials + the Phosphor weight CSS, postcss-nesting, postcss-url woff2 →
// data-URI). This helper runs that same pipeline directly so the test can assert the
// foundation inlines the font without standing up a full Vite build.

import { createRequire } from "node:module";
import postcss from "postcss";

// Loaded RELATIVE to this module so it resolves the repo-root config regardless of cwd.
// `require` returns `any` → the untyped CJS config needs no declaration.
const require = createRequire(import.meta.url);
const { plugins } = require("../../postcss.config.cjs") as { plugins: postcss.AcceptedPlugin[] };

/** Run the repo-root PostCSS pipeline on a CSS source. */
export const cssTransform = async (
  source: string,
  { filePath }: { filePath: string },
): Promise<string> => (await postcss(plugins).process(source, { from: filePath })).css;
