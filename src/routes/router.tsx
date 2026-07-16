import { createBrowserRouter } from "react-router";
import { ConnectingScreen } from "@/components/ConnectionOverlay";
import { ROUTES } from "@/constants/routes";
import { rootLoader, sessionLoader } from "@/lib/session/resolveSession";
import { DashboardRoute } from "./DashboardRoute";
import { PluginPage } from "./PluginPage";
import { PluginEditorPage } from "./PluginEditorPage";
import { SessionBootError } from "./SessionBootError";
import { SessionLayout } from "./SessionLayout";
import { SettingsRoute } from "./SettingsRoute";

// Data-mode route tree. "/" only resolves a session id (stored or minted) and
// replace-redirects to /:sessionId — the layout route whose loader returns the
// SessionInfo and whose element owns the OSC connection lifecycle. The settings
// child renders the drawer through DashboardRoute's Outlet (over the
// still-mounted dashboard, open only once the session is connected);
// plugins/:pluginId is the full-screen standalone plugin instance.
export const router = createBrowserRouter([
  {
    path: ROUTES.ROOT,
    loader: rootLoader,
    errorElement: <SessionBootError />,
    hydrateFallbackElement: <ConnectingScreen />,
  },
  {
    path: ROUTES.SESSION,
    loader: sessionLoader,
    element: <SessionLayout />,
    errorElement: <SessionBootError />,
    hydrateFallbackElement: <ConnectingScreen />,
    children: [
      {
        element: <DashboardRoute />,
        children: [
          { index: true, element: null },
          { path: ROUTES.SESSION_SETTINGS, element: <SettingsRoute /> },
        ],
      },
      { path: ROUTES.SESSION_PLUGIN_NEW, element: <PluginEditorPage /> },
      { path: ROUTES.SESSION_PLUGIN_EDIT, element: <PluginEditorPage /> },
      { path: ROUTES.SESSION_PLUGIN, element: <PluginPage /> },
    ],
  },
]);
