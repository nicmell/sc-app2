import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

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
