import { defineConfig } from "vite";
import litCss from "vite-plugin-lit-css";

// Standalone showcase. It consumes @sc-app/ui-components as SOURCE (no build step);
// vite-plugin-lit-css wraps the components' `.css` imports into Lit CSSResults (Vite's
// CSS pipeline + the repo-root postcss.config.cjs run first), with HMR. `es2022` lowers
// the `@property() accessor` decorators in the source.
export default defineConfig({
  esbuild: { target: "es2022" },
  plugins: [litCss({ include: ["**/ui-components/src/**/*.css"] })],
});
