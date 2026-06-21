// scsynth error/warning banners, rendered with the ui-components <sc-toast-base>
// primitive: a bottom-right stack, portaled to <body> and shown as a top-layer
// `popover="manual"` — the same layer the modals/popovers use, so the stack is
// never clipped and coexists with an open <sc-modal-base> (the toasts sit
// bottom-right, the modal centred — no overlap; note a modal <dialog> still
// renders above popovers in the top layer, so this isn't a way to cover it).
// Each banner auto-dismisses after a timeout (reset when a coalesced repeat
// refreshes its `ts`) and can be closed manually. Driven by the OscClient store.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ScToast } from "@sc-app/ui-components/react";
import { oscClient, useScsynthErrors } from "@/stores/osc";
import type { ScsynthError } from "@/types/stores";

/** How long a banner lingers before auto-dismissing. */
const DISMISS_MS = 8000;

const POPOVER_SUPPORTED =
  typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

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
  const ref = useRef<HTMLDivElement>(null);

  // Promote the stack into the top layer once it's mounted (so it's never
  // clipped by a transformed/overflow ancestor and renders over the page chrome).
  // Guarded — degrades to the CSS-positioned, z-index stack where the Popover
  // API is absent.
  useEffect(() => {
    const el = ref.current;
    if (!el || !POPOVER_SUPPORTED || errors.length === 0) return;
    try {
      if (el.popover !== "manual") el.popover = "manual";
      if (!el.matches(":popover-open")) el.showPopover();
    } catch {
      /* top layer unavailable */
    }
  }, [errors]);

  if (errors.length === 0) return null;
  return createPortal(
    <div ref={ref} className="sc-toast-stack" aria-live="polite">
      {errors.map((e) => (
        <Toast key={e.id} error={e} />
      ))}
    </div>,
    document.body,
  );
}
