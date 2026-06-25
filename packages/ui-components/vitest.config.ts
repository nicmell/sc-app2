import { defineConfig } from "vitest/config";
import { litCss } from "./lit-css";

// The `-base` widgets use `@property() accessor` standard decorators, which esbuild
// only lowers when the target isn't esnext. happy-dom gives the suite a DOM to mount
// custom elements into. litCss compiles the components' `.css` imports to Lit
// CSSResults (the PostCSS pipeline), the same way the app/example do.
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [litCss()],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
