import { Button, Cluster, Progress } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { session, useStatus } from "@/stores/session";
import "./ConnectionOverlay.scss";

/** Full-screen connection feedback over the dashboard (ui-components modal
 *  primitives): while the session boots, a backdrop with the indeterminate
 *  loading bar; when the connection fails, a modal with a notice and a Retry
 *  button that re-runs the whole connection flow. Renders nothing once
 *  connected. Deliberately not dismissable — nothing behind it is usable
 *  without a session. */
export function ConnectionOverlay() {
  const status = useStatus();
  if (status === "connected") return null;
  if (status === "connecting") {
    return (
      <div className="sc-modal__backdrop">
        <div className="connection-loader">
          <Progress label="Connecting to the session…" />
        </div>
      </div>
    );
  }
  return (
    <Modal label="Connection failed">
      <h2 className="sc-modal__title">Connection failed</h2>
      <p className="sc-modal__body">
        The session could not be established — the server or scsynth may be down.
      </p>
      <Cluster className="sc-modal__actions">
        <Button label="Retry" onClick={() => void session.retry()} />
      </Cluster>
    </Modal>
  );
}
