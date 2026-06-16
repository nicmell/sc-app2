import { Modal } from "@/components/ui/Modal";
import { session, useStatus } from "@/stores/session";

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
      <div className="modal-backdrop">
        <div className="connection-loader">
          <div className="modal-progress" />
        </div>
      </div>
    );
  }
  return (
    <Modal>
      <h2 className="modal-title">Connection failed</h2>
      <p className="modal-body">
        The session could not be established — the server or scsynth may be down.
      </p>
      <div className="cluster modal-actions">
        <button type="button" onClick={() => void session.retry()}>
          Retry
        </button>
      </div>
    </Modal>
  );
}
