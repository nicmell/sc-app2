// PostCSS pipeline for the package's CSS (run by lit-css.ts on every component +
// foundation `.css`, and auto-discovered by the package's Vite/vitest). Order matters:
//
//   1. postcss-import — inline `@import` (the foundation partials + the Phosphor weight
//      CSS, whose package-exports subpath the default resolver won't follow, so we
//      resolve it via Node `require.resolve`).
//   2. postcss-nesting — flatten the native `&` nesting the components use.
//   3. postcss-url — inline the now-merged Phosphor `@font-face` woff2 as data-URIs
//      (resolved relative to each rule's source file — no basePath needed — with the
//      14 KB default cap lifted so the ~150 KB fonts aren't skipped).

const { createRequire } = require("node:module");
const path = require("node:path");

// Resolve @phosphor-icons from THIS package's dir (not cwd) — the config is loaded by
// the app, the example, and vitest, each with a different cwd.
const req = createRequire(path.join(__dirname, "package.json"));

module.exports = {
  plugins: [
    require("postcss-import")({
      resolve: (id, basedir) =>
        id.startsWith("@phosphor-icons/web/") ? req.resolve(id) : path.resolve(basedir, id),
    }),
    require("postcss-nesting")(),
    require("postcss-url")({ url: "inline", filter: /\.woff2($|\?)/, maxSize: Infinity }),
  ],
};
