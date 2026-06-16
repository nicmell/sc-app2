// scsynth error/warning banners, rendered with the ui-components <sc-toast-base>
// primitive: a bottom-right stack, portaled to <body>. Each banner auto-dismisses
// after a timeout (reset when a coalesced repeat refreshes its `ts`) and can be
// closed manually. Driven by the OscClient's coalescing error store.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ScToast } from "@sc-app/ui-components/react";
import { oscClient, useScsynthErrors } from "@/stores/osc";
import type { ScsynthError } from "@/types/stores";

/** How long a banner lingers before auto-dismissing. */
const DISMISS_MS = 8000;

function Toast({ error }: { error: ScsynthError }) {
  // Re-arm whenever the entry's timestamp changes (a coalesced repeat refreshes
  // `ts`), so the countdown restarts on each new occurrence.
  useEffect(() => {
    const t = setTimeout(() => oscClient.dismissError(error.id), DISMISS_MS);
    return () => clearTimeout(t);
  }, [error.id, error.ts]);

  const label = error.address ? `${error.address}: ${error.message}` : error.message;
  const message = error.count > 1 ? `${label} ×${error.count}` : label;
  return (
    <ScToast
      variant={error.variant}
      message={message}
      onDismiss={() => oscClient.dismissError(error.id)}
    />
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
