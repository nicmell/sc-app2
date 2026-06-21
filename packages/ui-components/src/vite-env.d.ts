/// <reference types="vite/client" />
// Pulls in Vite's ambient module declarations (incl. `*.module.css` → the
// scoped class map, and `*?inline` → the processed CSS string) so the
// components can `import styles from "./sc-x.module.css"` and shadow components
// can `import css from "./sc-x.module.css?inline"` under `tsc` (the package
// tsconfig sets `types: ["node"]`, which a triple-slash reference bypasses).
