import { defineConfig } from "tsup";
import { litCssPlugin } from "esbuild-plugin-lit-css";
import { cssTransform, cssFilter } from "./lit-css";

export default defineConfig({
  entry: ["src/components/index.ts", "src/components/react.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Lower the standard `@property() accessor` decorators (esbuild only does this
  // below esnext) — matches the current Vite/vitest setting.
  target: "es2022",
  // deps + peerDeps (lit, @lit/*, @floating-ui/dom, classnames, react, react-dom)
  // are auto-externalized by tsup. `.css` (components + foundation) → Lit CSSResult
  // via lit-css + the PostCSS pipeline (lit-css.ts / postcss.config.cjs); the
  // foundation's Phosphor icon font is @import-inlined + woff2 data-URI'd at this
  // point, so @phosphor-icons/web is build-time only and never appears in the dist.
  // `inline: true` folds each CSSResult into its importing module rather than emitting
  // a separate .css module — which esbuild's native CSS loader would otherwise try to
  // bundle, choking on the Phosphor @font-face's relative woff/ttf/svg fallback urls.
  esbuildPlugins: [litCssPlugin({ filter: cssFilter, transform: cssTransform, inline: true })],
});
