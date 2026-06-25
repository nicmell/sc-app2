// Source-consumption build glue. The app, the example, and vitest all compile this
// package's component/foundation `.css` on the fly (no build step). A plain transform
// plugin can't do this: Vite's built-in CSS handling owns `.css` and would turn
// `import styles from "./x.css"` into a style-injecting, default-less module. And
// vite-plugin-lit-css, while it intercepts correctly (enforce: "pre" + load), has no
// `transform` hook — so it can't run our PostCSS pipeline (the @import inlining + woff2
// data-URI are essential). So this small Vite plugin does both: redirect the package's
// own `.css` to a VIRTUAL module (no `.css` extension → Vite's CSS pipeline ignores it)
// and emit a Lit `CSSResult` built by PostCSS (postcss.config.cjs): postcss-import
// (incl. the Phosphor weight CSS), postcss-nesting, postcss-url. Plain CSS — no Sass.

import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import postcss from "postcss";

// Loaded RELATIVE to this module (not cwd) so it resolves from the package, the app, or
// vitest alike. `require` returns `any` → the untyped CJS config needs no declaration.
const require = createRequire(import.meta.url);
const { plugins } = require("./postcss.config.cjs") as { plugins: postcss.AcceptedPlugin[] };

/** Run the PostCSS pipeline on a CSS source. Exported for the build-pipeline test. */
export const cssTransform = async (
  source: string,
  { filePath }: { filePath: string },
): Promise<string> => (await postcss(plugins).process(source, { from: filePath })).css;

// This package's own `src/` — only its `.css` becomes CSSResults; consumers' own CSS
// (the app's App.css, …) is left to Vite's normal pipeline.
const PKG_SRC = fileURLToPath(new URL("./src/", import.meta.url));
const VIRTUAL = "\0lit-css:";

/** Vite plugin: compile this package's source `.css` imports to Lit CSSResults. */
export function litCss(): Plugin {
  return {
    name: "sc-lit-css",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!importer || !source.endsWith(".css")) return null;
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved || !resolved.id.startsWith(PKG_SRC)) return null;
      // Drop the `.css` so Vite's CSS pipeline ignores the virtual id (re-added in load).
      return VIRTUAL + resolved.id.slice(0, -".css".length);
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL)) return null;
      const file = id.slice(VIRTUAL.length) + ".css";
      this.addWatchFile(file);
      const css = await cssTransform(await readFile(file, "utf8"), { filePath: file });
      return `import { unsafeCSS } from "lit";\nexport default unsafeCSS(${JSON.stringify(css)});`;
    },
  };
}
