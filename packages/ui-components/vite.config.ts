import { defineConfig, type PluginOption } from "vite";
import litCss from "rollup-plugin-lit-css";
import { scssTransform } from "./build/lit-css";

// Dev-server config for the package's index.html (`npx vite` / `yarn demo`).
// - es2022 lowers the `@property() accessor` standard decorators.
// - lit-css compiles each component's `.scss` import to a Lit CSSResult (sass);
//   Vite runs the Rollup plugin in serve too.
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  // Cast: rollup-plugin-lit-css types against standalone rollup; Vite bundles its
  // own rollup types (the well-known cross-version Plugin clash).
  plugins: [litCss({ include: ["**/*.scss"], transform: scssTransform }) as PluginOption],
});
