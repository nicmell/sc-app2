/// <reference types="vite/client" />
// `@sc-app/ui-components` is consumed as SOURCE, so this app's tsc follows into the
// components' `import styles from "./x.css"`. vite-plugin-lit-css ships the `*.css` →
// `CSSResult` ambient (merges with vite/client's empty `*.css`), so we reference it
// rather than hand-maintaining the declaration.
/// <reference types="vite-plugin-lit-css/client" />
