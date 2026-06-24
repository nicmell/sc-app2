import { defineConfig } from "vite";

// Standalone showcase for @sc-app/ui-components. It consumes the BUILT package
// (resolved via the workspace) — already-compiled JS with the foundation + icon font
// baked in — so there's no SCSS/lit-css or decorator lowering to do here (that all
// lives in the library's own build). Run `yarn demo` from the package dir (builds
// the library first) or `vite` from here against an existing build.
export default defineConfig({});
