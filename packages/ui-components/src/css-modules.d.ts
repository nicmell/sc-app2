// `*.scss` imports resolve to a Lit `CSSResult` (the lit-css build/dev plugins
// compile the SCSS and wrap it in a `css` tagged template).
declare module "*.scss" {
  import type { CSSResult } from "lit";
  const styles: CSSResult;
  export default styles;
}
