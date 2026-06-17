// Vite's `?inline` query returns a CSS file's (bundled, @import-resolved) text
// as a default string export — used to adopt the foundation into a shadow root.
declare module "*.css?inline" {
  const css: string;
  export default css;
}
