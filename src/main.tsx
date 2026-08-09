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
// Activate the OSC packet observers at the application composition root.
import "@/lib/osc/telemetry";
import "@/lib/osc/watchdog";

// Define the plugin custom elements + the ui-components `-base` widgets before
// the router renders any route that can mount them.
registerScElements();
registerUiComponents();

// DEV-only debug hook: expose the module singletons for CDP-driven live
// debugging — stable handles onto the store, the OSC client (tx/rx log,
// command methods), the element registry, and the session, so live probes
// read state instead of spelunking the DOM. Absent from production builds.
if (import.meta.env.DEV) {
  void Promise.all([
    import("@/stores/store"),
    import("@/stores/osc"),
    import("@/runtime/registry"),
    import("@sc-app/server-commands"),
  ]).then(([{ appStore }, { oscClient, oscTelemetry }, registry, commands]) => {
    (window as unknown as Record<string, unknown>).__scDebug = {
      appStore,
      oscClient,
      oscTelemetry,
      registry,
      session,
      // The OSC constructors (sGetn, nSetn, …) — probes can send raw queries
      // (e.g. a /s_getn readback of a live node's control array) and watch
      // the reply land in the rx log.
      commands,
    };
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
