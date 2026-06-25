// `*.css` imports resolve to a Lit `CSSResult` (vite-plugin-lit-css runs them through
// Vite's CSS pipeline and wraps the result in a `css` tagged template).
declare module "*.css" {
  import type { CSSResult } from "lit";
  const styles: CSSResult;
  export default styles;
}
