import { defineConfig } from "vite";
import { litCss } from "../lit-css";

// Standalone showcase. It consumes @sc-app/ui-components as SOURCE (no build step), so
// litCss compiles the components' `.css` imports to Lit CSSResults on the fly, with HMR.
// `es2022` lowers the `@property() accessor` decorators in the source.
export default defineConfig({
  esbuild: { target: "es2022" },
  plugins: [litCss()],
});
