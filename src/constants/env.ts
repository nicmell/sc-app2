export const _DEV_ = import.meta.env.DEV;

declare global {
  interface Window {
    /** Injected by the Tauri webview's initialization script; absent in a browser. */
    HTTP_BASE_URL?: string;
  }
}

/** The HTTP base every request targets: `http://127.0.0.1:<port>` in Tauri,
 *  `""` (same-origin / Vite-proxied relative URLs) in a browser. */
export const HTTP_BASE_URL: string = window.HTTP_BASE_URL ?? "";
