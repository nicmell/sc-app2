// PostCSS pipeline for the package's CSS, auto-discovered by the app's, the example's,
// and vitest's Vite. Since `vite-plugin-lit-css` routes the components' `.css` through
// Vite's own CSS pipeline (it patches the css-post plugin), Vite already inlines `@import`
// (the foundation partials + the Phosphor weight CSS, exports subpaths and all) and ships
// the native `&` nesting as-is — so postcss-import and postcss-nesting are redundant.
//
// The ONE thing Vite can't do here: its asset pipeline rewrites font url()s to
// `__VITE_ASSET__` placeholders that only get resolved for CSS that stays in the bundle.
// vite-plugin-lit-css lifts this CSS into a JS string before that resolution, so any
// non-inlined font url would dangle. postcss-url inlines the Phosphor woff2 as data-URIs
// (the 14 KB default cap lifted so the ~150 KB fonts aren't skipped), making the
// foundation CSSResult self-contained.

module.exports = {
  plugins: [require("postcss-url")({ url: "inline", filter: /\.woff2($|\?)/, maxSize: Infinity })],
};
