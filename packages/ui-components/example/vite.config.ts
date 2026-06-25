import { defineConfig } from "vite";
import litCss from "vite-plugin-lit-css";

// Standalone showcase. It consumes @sc-app/ui-components as SOURCE (no build step);
// vite-plugin-lit-css wraps the components' `.css` imports into Lit CSSResults, with HMR.
// `es2022` lowers the `@property() accessor` decorators in the source. The foundation
// ENTRY (foundations/index.css) is EXCLUDED so it stays a plain stylesheet for the
// document <head> (the side-effect import in src/main.ts).
export default defineConfig({
  esbuild: { target: "es2022" },
  plugins: [
    litCss({
      include: ["**/ui-components/src/**/*.css"],
      exclude: ["**/ui-components/src/foundations/index.css"],
    }),
  ],
});
