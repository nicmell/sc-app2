// The dashboard layout: the grid stays mounted while the <Outlet/> renders the
// settings child (SettingsRoute — the drawer, gated on the connected session).
// The header button toggles between the two URLs.

import { generatePath, Outlet, useMatch, useNavigate, useParams } from "react-router";
import { Dashboard } from "@/components/Dashboard";
import { ROUTES } from "@/constants/routes";

export function DashboardRoute() {
  const settingsOpen = Boolean(useMatch(ROUTES.SESSION_SETTINGS));
  const navigate = useNavigate();
  const sessionId = useParams().sessionId!;
  const dashboardPath = generatePath(ROUTES.SESSION, { sessionId });
  const settingsPath = generatePath(ROUTES.SESSION_SETTINGS, { sessionId });

  return (
    <>
      <Dashboard
        onToggleDrawer={() => void navigate(settingsOpen ? dashboardPath : settingsPath)}
      />
      <Outlet />
    </>
  );
}
