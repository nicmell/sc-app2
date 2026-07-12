import { useRevalidator } from "react-router";
import { useStatus } from "@/stores/session";
import { ConnectingScreen } from "./ConnectingScreen";
import { ConnectionErrorModal } from "./ConnectionErrorModal";

/** Full-screen connection feedback over the current route (ui-components modal
 *  primitives): while the session boots, a backdrop with the indeterminate
 *  loading bar; when the connection fails, a modal with a notice and a Retry
 *  button. Retry revalidates the route loaders in place: the session loader
 *  re-resolves (reviving the session or minting + redirecting to a fresh one,
 *  with a fresh 503 budget) and hands SessionLayout a new info object, whose
 *  effect reconnects — without navigating away from the current page. Renders
 *  nothing once connected. Deliberately not dismissable — nothing behind it is
 *  usable without a session. */
export function ConnectionOverlay() {
  const status = useStatus();
  const revalidator = useRevalidator();
  if (status === "connected") return null;
  if (status === "connecting") return <ConnectingScreen />;
  return <ConnectionErrorModal onRetry={() => void revalidator.revalidate()} />;
}
