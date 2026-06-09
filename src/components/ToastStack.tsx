// scsynth error/warning banners, rendered with the ui-foundation `.toast`
// primitive: a bottom-right stack, portaled to <body>. Each banner auto-dismisses
// after a timeout (reset when a coalesced repeat refreshes its `ts`) and can be
// closed manually. Driven by the session's coalescing error store.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { session, useScsynthErrors } from "../state/session";
import type { ScsynthError } from "../session/SessionManager";

/** How long a banner lingers before auto-dismissing. */
const DISMISS_MS = 8000;

function Toast({ error }: { error: ScsynthError }) {
  // Re-arm whenever the entry's timestamp changes (a coalesced repeat refreshes
  // `ts`), so the countdown restarts on each new occurrence.
  useEffect(() => {
    const t = setTimeout(() => session.dismissError(error.id), DISMISS_MS);
    return () => clearTimeout(t);
  }, [error.id, error.ts]);

  const label = error.address ? `${error.address}: ${error.message}` : error.message;
  return (
    <div className="toast" data-variant={error.variant} role="status">
      <span className="toast-message">
        {label}
        {error.count > 1 && ` ×${error.count}`}
      </span>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss"
        onClick={() => session.dismissError(error.id)}
      >
        ×
      </button>
    </div>
  );
}

export function ToastStack() {
  const errors = useScsynthErrors();
  if (errors.length === 0) return null;
  return createPortal(
    <div className="toast-stack" aria-live="polite">
      {errors.map((e) => (
        <Toast key={e.id} error={e} />
      ))}
    </div>,
    document.body,
  );
}
