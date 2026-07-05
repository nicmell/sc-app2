// Foundation CSS in the document <head> — a render-blocking stylesheet, so the first
// paint is already styled (no FOUC) and the Phosphor @font-face registers document-wide.
// Vite extracts this side-effect import to a <link> in the production build; shadow
// components adopt only a font-free subset (the shadow base, foundations/shadow.scss), so
// the fonts are never duplicated into a shadow CSSResult.
import "@sc-app/ui-components";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerScElements } from "./sc-elements";
import { registerUiComponents } from "@sc-app/ui-components/lit";
import { session } from "@/lib/session/SessionManager";

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
