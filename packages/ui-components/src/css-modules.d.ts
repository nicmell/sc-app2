// `*.css` imports resolve to a Lit `CSSResult` (the lit-css build/dev plugins
// run the PostCSS pipeline and wrap it in a `css` tagged template).
declare module "*.css" {
  import type { CSSResult } from "lit";
  const styles: CSSResult;
  export default styles;
}
