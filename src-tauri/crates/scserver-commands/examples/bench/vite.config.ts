import { defineConfig } from 'vite';

// The jco-transpiled component (pkg/) uses top-level await and loads its
// core WASM via `new URL('./*.core.wasm', import.meta.url)` + fetch —
// Vite rewrites those to hashed asset URLs on build. `esnext` keeps the
// top-level await. The preview2-shim resolves to its browser build via
// the default export condition, so no Node polyfills are needed.
export default defineConfig({
  build: { target: 'esnext' },
  optimizeDeps: {
    // Let Vite prebundle the shim + osc-js, but never the generated pkg
    // (it must stay a first-class source module so the `new URL()` wasm
    // references are transformed).
    exclude: ['@bytecodealliance/preview2-shim'],
  },
});
