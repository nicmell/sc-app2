// Foundation CSS in the document <head> — a render-blocking stylesheet, so the first
// paint is already styled (no FOUC) and the Phosphor @font-face registers document-wide.
// Vite extracts this side-effect import to a <link> in the production build; shadow
// components adopt only a font-free subset (the shadow base, foundations/shadow.scss), so
// the fonts are never duplicated into a shadow CSSResult.
import "@sc-app/ui-components";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { registerScElements } from "./sc-elements";
import { registerUiComponents } from "@sc-app/ui-components/lit";
import { router } from "@/routes/router";
// Activate the OSC packet observers and status watchdog at the application composition root.
import "@/lib/osc/middlewares";
// DEV-only __scDebug hook for CDP-driven live debugging (no-op in production).
import "@/lib/utils/debug";

// Define the plugin custom elements + the ui-components `-base` widgets before
// the router renders any route that can mount them.
registerScElements();
registerUiComponents();

// The wasm validator is a route concern: the layout route's loader awaits
// initValidator() concurrently with the session resolution (routes/Layout),
// so rendering starts immediately under the loading fallback.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
