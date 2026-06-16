import "@sc-app/ui-components";
// Phosphor icon font — fill weight only (the one weight sc-icon-base supports).
// Provides the global `.ph-fill` / `.ph-<name>` classes <sc-icon-base> emits.
import "@phosphor-icons/web/fill";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerScElements } from "./sc-elements";
import { session } from "@/lib/session/SessionManager";

// Define the plugin custom elements + open the session before first render so
// injected plugin HTML upgrades and the elements have a live session to read.
// (The HTTP base URL needs no async resolution: Tauri injects HTTP_BASE_URL
// before any code runs; browsers are same-origin — see src/http.)
registerScElements();
void session.start();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
