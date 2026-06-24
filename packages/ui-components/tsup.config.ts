import { defineConfig } from "tsup";
import { litCssPlugin } from "esbuild-plugin-lit-css";
import { scssTransform, scssFilter } from "./build/lit-css";

export default defineConfig({
  entry: ["src/components/index.ts", "src/components/react.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Lower the standard `@property() accessor` decorators (esbuild only does this
  // below esnext) — matches the current Vite/vitest setting.
  target: "es2022",
  // deps + peerDeps (lit, @lit/*, @floating-ui/dom, classnames, @phosphor-icons/web,
  // react, react-dom) are auto-externalized by tsup, and esbuild externalizes
  // their subpaths too — so the Phosphor weight CSS `@phosphor-icons/web/<weight>/
  // style.css?inline` stays external (query and all), and the consuming app's
  // Vite resolves it + emits the woff2. No explicit externalizer needed.
  // `.scss` (components + foundation) → Lit CSSResult via lit-css + sass.
  esbuildPlugins: [litCssPlugin({ filter: scssFilter, transform: scssTransform })],
});
