// Shared CSS → CSSResult transform for the lit-css plugins (esbuild-plugin-lit-css in
// the tsup build; rollup-plugin-lit-css in the package's vitest). lit-css wraps the
// returned CSS in a Lit `css` tagged template (a CSSResult); we just run the project's
// PostCSS pipeline (postcss.config.cjs) on the source — postcss-import (incl. the
// Phosphor weight CSS), postcss-nesting, and postcss-url (woff2 → data-URI).
//
// No Sass: the styles are plain CSS (custom properties + native `&` nesting).

import postcss from "postcss";
import postcssrc from "postcss-load-config";

// Load postcss.config.cjs once (cached). Searches from the package dir — the cwd for
// tsup, Vite, and vitest, all of which run from here.
let configPromise: ReturnType<typeof postcssrc> | undefined;
const loadConfig = () => (configPromise ??= postcssrc({}, process.cwd()));

export const cssTransform = async (
  source: string,
  { filePath }: { filePath: string },
): Promise<string> => {
  const { plugins, options } = await loadConfig();
  const { css } = await postcss(plugins).process(source, { ...options, from: filePath });
  return css;
};

/** Match `.css`. */
export const cssFilter = /\.css$/;
