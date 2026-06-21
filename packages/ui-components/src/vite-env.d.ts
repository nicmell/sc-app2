/// <reference types="vite/client" />
// Pulls in Vite's ambient module declarations (incl. `*?inline` → the processed
// CSS string) so internal/foundation-styles.ts can `import css from
// "../../foundations/index.css?inline"` under `tsc` (the package tsconfig sets
// `types: ["node"]`, which a triple-slash reference bypasses).
