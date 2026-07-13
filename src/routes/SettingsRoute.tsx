// The /:sessionId/settings child route, rendered through DashboardRoute's
// <Outlet/> over the still-mounted dashboard. The drawer opens only once the
// session is fully connected — while connecting or errored it stays closed, so
// the top-layer <dialog> never paints above the ConnectionOverlay's scrim or
// error modal (mounting flips `open` false → true, so the slide-in plays).
// Closing navigates back to the dashboard, which unmounts this route.

import { generatePath, useNavigate, useParams } from "react-router";
import { Drawer } from "@/components/Drawer";
import { ROUTES } from "@/constants/routes";
import { useStatus } from "@/stores/session";

export function SettingsRoute() {
  const sessionId = useParams().sessionId!;
  const navigate = useNavigate();
  const connected = useStatus() === "connected";
  const close = () => void navigate(generatePath(ROUTES.SESSION, { sessionId }));
  return <Drawer open={connected} onClose={close} />;
}
