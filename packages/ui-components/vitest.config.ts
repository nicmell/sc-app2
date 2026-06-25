import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";
import litCss from "rollup-plugin-lit-css";
import { cssTransform } from "./lit-css";

// The `-base` widgets use `@property() accessor` standard decorators, which
// esbuild only lowers when the target isn't esnext (mirrors the root app). happy-dom
// gives the suite a DOM to mount custom elements into. lit-css turns the components'
// `.css` imports into Lit CSSResults via the PostCSS pipeline (postcss.config.cjs).
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [litCss({ include: ["**/*.css"], transform: cssTransform }) as PluginOption],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
