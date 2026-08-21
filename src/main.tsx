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
import { session } from "@/lib/session/SessionManager";
import { router } from "@/routes/router";
// Activate the OSC packet observers and status watchdog at the application composition root.
import "@/lib/osc/middlewares";

// Define the plugin custom elements + the ui-components `-base` widgets before
// the router renders any route that can mount them.
registerScElements();
registerUiComponents();

// DEV-only debug hook: expose the module singletons for CDP-driven live
// debugging — stable handles onto the store, the OSC client (tx/rx log,
// command methods), and the session, so live probes read state instead of
// spelunking the DOM (parsed trees hang off the mounted <sc-plugin> hosts).
if (import.meta.env.DEV) {
  void Promise.all([
    import("@/stores/store"),
    import("@/stores/osc"),
    import("@sc-app/server-commands"),
  ]).then(([{ appStore }, { oscClient, log, errors, scsynthStatus, clock }, commands]) => {
    (window as unknown as Record<string, unknown>).__scDebug = {
      appStore,
      oscClient,
      osc: { log, errors, scsynthStatus, clock },
      session,
      // The OSC constructors (sGetn, nSetn, …) — probes can send raw queries
      // (e.g. a /s_getn readback of a live node's control array) and watch
      // the reply land in the rx log.
      commands,
    };
  });
}

// The wasm validator is a route concern: the router's pathless boot root
// awaits initValidator() alongside the session loaders (routes/router.tsx),
// so rendering starts immediately under the connecting fallback.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
