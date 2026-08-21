import { useRevalidator } from "react-router";
import { Button } from "@/components/ui";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Modal } from "@/components/ui/Modal";
import { useStatus } from "@/stores/session";

/** Full-screen feedback over the current route while the LIVE connection is
 *  not up: the loading scrim while the session boots, a Retry modal when the
 *  connection fails. Retry revalidates the route loaders in place: the session
 *  loader re-resolves (reviving the session or minting + redirecting to a
 *  fresh one, with a fresh 503 budget) and hands SessionLayout a new info
 *  object, whose effect reconnects — without navigating away from the current
 *  page. Renders nothing once connected. Deliberately not dismissable —
 *  nothing behind it is usable without a session. */
export function ConnectionOverlay() {
  const status = useStatus();
  const revalidator = useRevalidator();
  if (status === "connected") return null;
  if (status === "connecting") return <LoadingOverlay label="Connecting to the session…" />;
  return (
    <Modal
      title="Connection failed"
      description="The session could not be established — the server or scsynth may be down."
      actions={<Button label="Retry" onClick={() => void revalidator.revalidate()} />}
    />
  );
}
