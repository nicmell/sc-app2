import { createBrowserRouter } from "react-router";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ROUTES } from "@/constants/routes";
import { DashboardRoute } from "./DashboardRoute";
import { Layout, layoutLoader } from "./Layout";
import { PluginPage } from "./PluginPage";
import { RouteError } from "./RouteError";
import { SettingsRoute } from "./SettingsRoute";

// Data-mode route tree: ONE layout route owns the whole boot — its loader
// (routes/Layout) awaits the wasm validator and the session resolution
// concurrently, its element is the app frame with every cross-cutting
// surface, RouteError is the single loader-failure modal, and the hydrate
// fallback covers the initial load. The session param is OPTIONAL: the loader
// resolves stored/minted/revived sessions and keeps the URL truthful (see
// resolveSession). The settings child renders the drawer through
// DashboardRoute's Outlet (over the still-mounted dashboard, open only once
// the session is connected); plugins/:pluginId is the full-screen standalone
// plugin instance.
export const router = createBrowserRouter([
  {
    path: ROUTES.SESSION,
    loader: layoutLoader,
    element: <Layout />,
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
]);
