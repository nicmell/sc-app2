// Phosphor icon font — fill weight only (the one weight sc-icon-base supports).
// Provides the global `.ph-fill` / `.ph-<name>` classes <sc-icon-base> emits.
import "@phosphor-icons/web/fill";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerScElements } from "./sc-elements";
import { registerUiComponents, adoptFoundation } from "@sc-app/ui-components/lit";
import { session } from "@/lib/session/SessionManager";

// Adopt the foundation stylesheet onto the document — the SAME shared
// CSSStyleSheet that shadow-DOM widgets (sc-select) adopt into their roots, so
// the foundation CSS is parsed once and shipped once (no separate `<style>`).
adoptFoundation();
// Define the plugin custom elements + the ui-components `-base` widgets (used by
// the React shell and inside Lit widgets like sc-strudel), then open the session
// before first render so injected plugin HTML upgrades and the elements have a
// live session to read. (The HTTP base URL needs no async resolution: Tauri
// injects HTTP_BASE_URL before any code runs; browsers are same-origin.)
registerScElements();
registerUiComponents();
void session.start();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
