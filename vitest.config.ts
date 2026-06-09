import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Worker-thread clients + WS servers need a little headroom over the default.
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
