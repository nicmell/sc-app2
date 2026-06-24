import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";
import litCss from "rollup-plugin-lit-css";
import { scssTransform } from "./lit-css";

// The `-base` widgets use `@property() accessor` standard decorators, which
// esbuild only lowers when the target isn't esnext (mirrors the demo config and
// the root app). happy-dom gives the suite a DOM to mount custom elements into.
// lit-css compiles the components' `.scss` imports to Lit CSSResults (sass).
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  plugins: [litCss({ include: ["**/*.scss"], transform: scssTransform }) as PluginOption],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
