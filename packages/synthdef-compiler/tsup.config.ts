import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/builders/index.ts",
    "src/registry.ts",
    "src/sugar/index.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
  // Zero runtime dependencies — nothing external to mark.
});
