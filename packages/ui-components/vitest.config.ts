import { defineConfig } from "vitest/config";

// The `-base` widgets use `@property() accessor` standard decorators, which
// esbuild only lowers when the target isn't esnext (mirrors the demo config and
// the root app). happy-dom gives the suite a DOM to mount custom elements into.
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
