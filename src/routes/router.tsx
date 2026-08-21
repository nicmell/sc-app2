import { createBrowserRouter } from "react-router";
import { initValidator } from "@sc-app/validate";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { RouteId, ROUTES } from "@/constants/routes";
import { sessionLoader } from "@/lib/session/resolveSession";
import { DashboardRoute } from "./DashboardRoute";
import { Layout } from "./Layout";
import { PluginPage } from "./PluginPage";
import { RouteError } from "./RouteError";
import { SettingsRoute } from "./SettingsRoute";

// Data-mode route tree: a pathless BOOT root whose loader awaits the wasm
// validator (matched loaders run in parallel and the router renders nothing
// until all settle, so every route element mounts with the spec map ready —
// getSpec/parseEntry never race init; a failed init throws into RouteError,
// whose Retry re-runs the loader — initValidator doesn't cache rejections, so
// the instantiation is retried) and whose element is the app Layout (frame +
// ToastStack + ConnectionOverlay + loading scrim; owns the OSC connection
// lifecycle over the session route's loader data). Below it, ONE session
// route with an OPTIONAL param: its loader resolves stored/minted/revived
// sessions and keeps the URL truthful (see resolveSession). A session-level
// RouteError keeps Layout (and its toasts) mounted around loader failures.
// The settings child renders the drawer through DashboardRoute's Outlet (over
// the still-mounted dashboard, open only once the session is connected);
// plugins/:pluginId is the full-screen standalone plugin instance.
export const router = createBrowserRouter([
  {
    loader: async () => {
      await initValidator();
      return null;
    },
    element: <Layout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <LoadingOverlay label="Loading…" />,
    children: [
      {
        id: RouteId.SESSION,
        path: ROUTES.SESSION,
        loader: sessionLoader,
        errorElement: <RouteError />,
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
