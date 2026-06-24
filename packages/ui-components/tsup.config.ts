import { defineConfig } from "tsup";
import { litCssPlugin } from "esbuild-plugin-lit-css";
import { scssTransform, scssFilter } from "./lit-css";

export default defineConfig({
  entry: ["src/components/index.ts", "src/components/react.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Lower the standard `@property() accessor` decorators (esbuild only does this
  // below esnext) — matches the current Vite/vitest setting.
  target: "es2022",
  // deps + peerDeps (lit, @lit/*, @floating-ui/dom, classnames, react, react-dom)
  // are auto-externalized by tsup. `.scss` (components + foundation) → Lit CSSResult
  // via lit-css + sass; the foundation's Phosphor icon font is resolved + inlined as
  // data-URI at this point (lit-css.ts), so @phosphor-icons/web is build-time
  // only and never appears in the dist.
  esbuildPlugins: [litCssPlugin({ filter: scssFilter, transform: scssTransform })],
});
