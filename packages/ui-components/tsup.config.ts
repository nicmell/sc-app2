import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Flatten a CSS file's relative `@import` chain into one string (the foundation
// is shallow + has no url() assets, so this is lossless).
function inlineCssImports(file: string): string {
  const css = readFileSync(file, "utf8");
  return css.replace(/@import\s+["']([^"']+)["']\s*;/g, (_m, rel: string) =>
    inlineCssImports(resolve(dirname(file), rel)),
  );
}

// `?inline` CSS imports (a Vite-ism) — split by origin:
//   • RELATIVE (our foundation: `../../foundations/index.css?inline`) → flatten
//     the @import chain to a string and bake it into the dist JS (self-contained).
//   • BARE (Phosphor: `@phosphor-icons/web/<weight>/style.css?inline`) → leave
//     EXTERNAL so the consuming app's Vite resolves it + emits the woff2 (the
//     internal-only font strategy; a relative dist path could never reach them).
const inlineCss: Plugin = {
  name: "inline-css-query",
  setup(b) {
    b.onResolve({ filter: /\.css\?inline$/ }, (args) => {
      if (!args.path.startsWith(".")) return { path: args.path, external: true };
      const real = resolve(args.resolveDir, args.path.replace(/\?inline$/, ""));
      // Virtual id that does NOT end in `.css`, so tsup's built-in CSS handling
      // can't claim it; the real fs path rides along in pluginData.
      return { path: `${real}?inline-bake`, namespace: "inline-css", pluginData: real };
    });
    b.onLoad({ filter: /.*/, namespace: "inline-css" }, (args) => ({
      contents: `export default ${JSON.stringify(inlineCssImports(args.pluginData as string))};`,
      loader: "js",
    }));
  },
};

export default defineConfig({
  entry: ["src/components/index.ts", "src/components/react.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // Lower the standard `@property() accessor` decorators (esbuild only does this
  // below esnext) — matches the current Vite/vitest setting.
  target: "es2022",
  // deps + peerDeps (lit, @lit/*, @floating-ui/dom, classnames, @phosphor-icons/web,
  // react, react-dom) are auto-externalized by tsup; their subpaths follow.
  esbuildPlugins: [inlineCss],
});
