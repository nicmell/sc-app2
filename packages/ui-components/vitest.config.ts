import { defineConfig } from "vitest/config";
import litCss from "vite-plugin-lit-css";

// The `-base` widgets use `@property() accessor` standard decorators, which esbuild
// only lowers when the target isn't esnext. happy-dom gives the suite a DOM to mount
// custom elements into. vite-plugin-lit-css wraps the components' `.css` imports into
// Lit CSSResults the same way the app/example do (exclude/include kept in sync with them).
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [
    litCss({
      include: ["**/ui-components/src/**/*.css"],
      exclude: ["**/ui-components/src/foundations/index.css"],
    }),
  ],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
