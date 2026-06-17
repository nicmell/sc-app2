// Phosphor icon font — fill weight only (the one weight sc-icon-base supports).
// Registers the @font-face at the document level so the "Phosphor-Fill" font is
// usable inside <sc-icon-base>'s shadow root (which adopts the glyph CSS itself).
import "@phosphor-icons/web/fill";
// The global foundation CSS: design tokens (:root custom properties, which
// inherit into every shadow root) + reset + base element styles + the few
// app-level layout classes. Every `-base` component styles itself in its own
// shadow, so this carries no component classes.
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
