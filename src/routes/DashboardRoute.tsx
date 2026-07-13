// The dashboard + its URL-driven settings drawer. The drawer stays MOUNTED
// with `open` = the /:sessionId/settings match, so the <sc-base-drawer> slide
// animation plays on both edges (the settings child route's element is null —
// presence only). The force-close on disconnect is App.tsx's old rule as a
// navigation: the drawer is a top-layer <dialog> that would paint above the
// ConnectionOverlay's connecting scrim.

import { useEffect } from "react";
import { generatePath, Outlet, useMatch, useNavigate, useParams } from "react-router";
import { Dashboard } from "@/components/Dashboard";
import { ROUTES } from "@/constants/routes";
import { Drawer } from "@/components/Drawer";
import { session } from "@/stores/session";

export function DashboardRoute() {
  const settingsOpen = Boolean(useMatch(ROUTES.SESSION_SETTINGS));
  const navigate = useNavigate();
  const sessionId = useParams().sessionId!;
  const dashboardPath = generatePath(ROUTES.SESSION, { sessionId });
  const settingsPath = generatePath(ROUTES.SESSION_SETTINGS, { sessionId });
  const close = () => void navigate(dashboardPath);

  useEffect(() => {
    const closeUnlessConnected = (status: string) => {
      if (status !== "connected" && settingsOpen) {
        void navigate(dashboardPath, { replace: true });
      }
    };
    // The subscription fires on CHANGES only — also check the current value,
    // or a deep link to /settings while disconnected keeps the drawer painted
    // above the connection scrim.
    closeUnlessConnected(session.status.get());
    return session.status.subscribe(closeUnlessConnected);
  }, [dashboardPath, navigate, settingsOpen]);

  return (
    <>
      <Dashboard
        onToggleDrawer={() => void navigate(settingsOpen ? dashboardPath : settingsPath)}
      />
      <Drawer open={settingsOpen} onClose={close} />
      <Outlet />
    </>
  );
}
