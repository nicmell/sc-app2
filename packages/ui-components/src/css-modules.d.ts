// `*.scss` imports resolve to a Lit `CSSResult` (the lit-css build/dev plugins
// compile the SCSS and wrap it in a `css` tagged template).
declare module "*.scss" {
  import type { CSSResult } from "lit";
  const styles: CSSResult;
  export default styles;
}

// Vite's `?inline` query returns a CSS file's text as a default string export —
// used for the external Phosphor weight CSS (`@phosphor-icons/web/*/style.css?inline`).
declare module "*.css?inline" {
  const css: string;
  export default css;
}
