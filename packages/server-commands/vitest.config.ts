import { defineConfig } from "vitest/config";

// Node environment: the suite exercises the real wasm component (loaded
// from pkg/ via jco's fs path) — no DOM involved.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
