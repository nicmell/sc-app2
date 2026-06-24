import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";
import { litCssPlugin } from "esbuild-plugin-lit-css";
import { scssTransform, scssFilter } from "./build/lit-css";

// Phosphor weight CSS is imported `?inline` (a Vite-ism) and must stay EXTERNAL
// so the consuming app's Vite resolves it + emits the woff2 (internal-only font
// strategy). lit-css only matches `.scss`, so these fall through to here.
const phosphorExternal: Plugin = {
  name: "phosphor-inline-external",
  setup(b) {
    b.onResolve({ filter: /^@phosphor-icons\/web\/.*\?inline$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

export default defineConfig({
  entry: ["src/components/index.ts", "src/components/react.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Lower the standard `@property() accessor` decorators (esbuild only does this
  // below esnext) — matches the current Vite/vitest setting.
  target: "es2022",
  // deps + peerDeps (lit, @lit/*, @floating-ui/dom, classnames, @phosphor-icons/web,
  // react, react-dom) are auto-externalized by tsup; their subpaths follow.
  // `.scss` (components + foundation) → Lit CSSResult via lit-css + sass.
  esbuildPlugins: [litCssPlugin({ filter: scssFilter, transform: scssTransform }), phosphorExternal],
});
