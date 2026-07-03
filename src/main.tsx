// The foundation is a render-blocking <link> in index.html (src/foundation.scss) so the
// first paint is already styled (no FOUC) — NOT a JS side-effect import here, which Vite
// would only inject after the module graph runs in dev. Shadow components adopt the
// font-free subset (foundations/reset.scss) themselves.
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
