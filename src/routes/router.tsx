import { createBrowserRouter } from "react-router";
import { initValidator } from "@sc-app/validate";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ROUTES } from "@/constants/routes";
import { rootLoader, sessionLoader } from "@/lib/session/resolveSession";
import { DashboardRoute } from "./DashboardRoute";
import { PluginPage } from "./PluginPage";
import { RouteError } from "./RouteError";
import { SessionLayout } from "./SessionLayout";
import { SettingsRoute } from "./SettingsRoute";

// Data-mode route tree, wrapped in a pathless BOOT root whose loader awaits the
// wasm validator — matched loaders run in parallel and the router renders
// nothing until all settle, so every route element mounts with the spec map
// ready (getSpec/parseEntry never race init). A failed init throws into the
// boot errorElement like any session failure; Retry re-runs the loader, and
// initValidator doesn't cache rejections, so the instantiation is retried.
// "/" only resolves a session id (stored or minted) and replace-redirects to
// /:sessionId — the layout route whose loader returns the SessionInfo and
// whose element owns the OSC connection lifecycle. The settings child renders
// the drawer through DashboardRoute's Outlet (over the still-mounted
// dashboard, open only once the session is connected); plugins/:pluginId is
// the full-screen standalone plugin instance.
export const router = createBrowserRouter([
  {
    loader: async () => {
      await initValidator();
      return null;
    },
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingOverlay label="Loading…" />,
    children: [
      {
        path: ROUTES.ROOT,
        loader: rootLoader,
        errorElement: <RouteError />,
        hydrateFallbackElement: <LoadingOverlay label="Loading…" />,
      },
      {
        path: ROUTES.SESSION,
        loader: sessionLoader,
        element: <SessionLayout />,
        errorElement: <RouteError />,
        hydrateFallbackElement: <LoadingOverlay label="Loading…" />,
        children: [
          {
            element: <DashboardRoute />,
            children: [
              { index: true, element: null },
              { path: ROUTES.SESSION_SETTINGS, element: <SettingsRoute /> },
            ],
          },
          { path: ROUTES.SESSION_PLUGIN, element: <PluginPage /> },
        ],
      },
    ],
  },
]);
