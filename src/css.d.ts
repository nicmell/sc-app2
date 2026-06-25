// `@sc-app/ui-components` is consumed as SOURCE, so this app's tsc follows into the
// components' `import styles from "./x.css"`. Type those as a Lit `CSSResult` (merges
// with vite/client's empty `declare module "*.css" {}`). The app's own CSS is imported
// for side effects only (`import "./App.css"`), so this default export is harmless there.
declare module "*.css" {
  import type { CSSResult } from "lit";
  const styles: CSSResult;
  export default styles;
}
