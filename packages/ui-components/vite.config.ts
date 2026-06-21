import { defineConfig } from "vite";

// Dev-server config for the package's index.html (`npx vite` / `vite` here).
// The only thing it needs over the zero-config default is decorator lowering:
// the `-base` widgets use `@property() accessor` standard decorators, which
// esbuild only lowers when the target isn't esnext (mirrors the root config).
export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  // Component styles ship as scoped CSS Modules (`sc-x.module.css`), imported by
  // each component. camelCaseOnly so locals read as `styles.stepUp`; the default
  // hashed scoped names give the per-component encapsulation.
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
