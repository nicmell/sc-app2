import { createBrowserRouter } from "react-router";
import { ConnectingScreen } from "@/components/ConnectionOverlay";
import { rootLoader, sessionLoader } from "@/lib/session/resolveSession";
import { DashboardRoute } from "./DashboardRoute";
import { PluginPage } from "./PluginPage";
import { SessionBootError } from "./SessionBootError";
import { SessionLayout } from "./SessionLayout";

// Data-mode route tree. "/" only resolves a session id (stored or minted) and
// replace-redirects to /:sessionId — the layout route whose loader returns the
// SessionInfo and whose element owns the OSC connection lifecycle. The settings
// child is presence-only (the drawer opens on match, over the still-mounted
// dashboard); plugins/:pluginId is the full-screen standalone plugin instance.
export const router = createBrowserRouter([
  {
    path: "/",
    loader: rootLoader,
    errorElement: <SessionBootError />,
    hydrateFallbackElement: <ConnectingScreen />,
  },
  {
    path: "/:sessionId",
    loader: sessionLoader,
    element: <SessionLayout />,
    errorElement: <SessionBootError />,
    hydrateFallbackElement: <ConnectingScreen />,
    children: [
      {
        element: <DashboardRoute />,
        children: [
          { index: true, element: null },
          { path: "settings", element: null },
        ],
      },
      { path: "plugins/:pluginId", element: <PluginPage /> },
    ],
  },
]);
