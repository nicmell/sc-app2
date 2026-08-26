import { useLocation, useNavigate, useRouteError } from "react-router";
import { Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { HttpError } from "@/lib/http";

/** The route errorElement: any loader failure lands here — the session
 *  mint/revive HTTP calls (503 budget exhausted, other API failures) and the
 *  boot root's wasm validator init. The copy is derived from the error: the
 *  scsynth-unregistered 503 gets the session wording, any other HTTP failure
 *  shows its envelope headline, anything else reports its own message. Retry
 *  is a same-path replace navigation — it re-runs every matched loader with
 *  a fresh retry budget. Not dismissable: nothing behind it works. */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const isHttp = error instanceof HttpError;
  const isScsynthDown = isHttp && error.status === 503;
  return (
    <Modal
      title={isHttp ? "Connection failed" : "Loading failed"}
      description={
        isScsynthDown
          ? "The session could not be established — the server or scsynth may be down."
          : isHttp
            ? `The session could not be established: ${error.message}`
            : `The app failed to load: ${error instanceof Error ? error.message : String(error)}`
      }
      actions={
        <Button label="Retry" onClick={() => void navigate(location.pathname, { replace: true })} />
      }
    />
  );
}
