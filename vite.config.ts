/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Lower standard (stage-3) decorators in the per-file esbuild transform —
  // the sc-elements use `@property() accessor` reactive properties and
  // Rollup's parser can't read raw decorator syntax (esbuild only lowers them
  // when the target isn't esnext).
  esbuild: {
    target: "es2022",
  },

  // react-grid-layout bundles react-draggable, whose drag-start logger reads
  // `process.env.DRAGGABLE_DEBUG` — `process` is undefined in the browser, so it
  // throws on the first drag/resize. Replace the expression with a constant.
  define: {
    "process.env.DRAGGABLE_DEBUG": "false",
  },
  // …and again for the dependency pre-bundle, which esbuild optimizes separately
  // from app source.
  optimizeDeps: {
    esbuildOptions: {
      define: {
        "process.env": "false",
      },
    },
  },

  resolve: {
    alias: {
      // Resolve the source-only workspace package to its TS entry so Vite
      // doesn't try to pre-bundle it as a dependency.
      "@sc-app/server-commands": fileURLToPath(
        new URL("./packages/server-commands/src/index.ts", import.meta.url),
      ),
      // `@/` → `src/` (mirrors tsconfig paths + the old sc-app convention).
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    // Emit a manifest mapping source files to their hashed build outputs.
    manifest: "manifest.json",
  },

  // Unit tests (`yarn test`): the example plugins through the sc-elements
  // parse engine in a simulated DOM — the fast runtime gate next to the full
  // CDP harness (scripts/validate-examples.mjs) — plus React component tests
  // (.tsx, e.g. the connection overlay). Tests are co-located next to the
  // unit under test (`*.test.ts(x)` beside the source); cross-cutting suites
  // (examples/controls/widgets) sit at their directory root.
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/lib/utils/test/test-setup.ts"],
    // The Strudel editor stack is browser-only and won't import under
    // happy-dom; alias the offending modules to inert stubs globally (the
    // parse engine never drives them). The codemirror stub records the
    // constructed editors for the suites that assert on them. Suites that need
    // bespoke behaviour can still vi.spyOn the stub's methods.
    alias: {
      "@strudel/codemirror": fileURLToPath(
        new URL("./src/lib/utils/test/stubs/strudel-codemirror.ts", import.meta.url),
      ),
      "@strudel/transpiler": fileURLToPath(
        new URL("./src/lib/utils/test/stubs/strudel-transpiler.ts", import.meta.url),
      ),
      "@strudel/core": fileURLToPath(
        new URL("./src/lib/utils/test/stubs/strudel-core.ts", import.meta.url),
      ),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // Same-origin proxy so the frontend can hit the headless server's API
    // (`yarn serve`, default port 3000) in browser dev. `/ws` proxies the
    // OSC-bridge WebSocket (ws: true), so `yarn dev` tunnels it to the server.
    proxy: {
      "/api": {
        target: process.env.SC_SERVER_URL || "http://127.0.0.1:3000",
      },
      "/ws": {
        target: process.env.SC_SERVER_URL || "http://127.0.0.1:3000",
        ws: true,
      },
    },
  },
}));
