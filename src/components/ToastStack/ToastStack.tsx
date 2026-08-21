// The global toast stack, rendered with the ui-components <sc-base-toast>
// primitive over the app-store toasts slice (stores/toasts — any producer
// pushes there; the OSC error middleware is one). A bottom-right stack,
// portaled to <body> and shown as a top-layer `popover="manual"` — the same
// layer the modals/popovers use, so the stack is never clipped and coexists
// with an open <sc-base-modal> (the toasts sit bottom-right, the modal
// centred — no overlap; note a modal <dialog> still renders above popovers in
// the top layer, so this isn't a way to cover it). Each toast auto-dismisses
// after a timeout and can be closed manually; the countdown deliberately does
// NOT re-arm on a coalesced repeat — while a modal <dialog> is open the whole
// document (top-layer popovers included) is inert, so a repeating error must
// not pin an unclickable toast forever.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Toast as BaseToast } from "@/components/ui";
import { TOAST_DISMISS_MS } from "@/constants/toasts";
import { dismissToast, useToasts } from "@/stores/toasts";
import type { ToastEntry } from "@/types/stores";
import styles from "./ToastStack.module.scss";

const POPOVER_SUPPORTED = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

function Toast({ toast }: { toast: ToastEntry }) {
  // One countdown per entry, from its first appearance — coalesced repeats bump
  // the ×count display but don't extend the toast's life (see the header note on
  // modal inertness). A recurrence after dismissal mints a new entry/toast.
  useEffect(() => {
    const t = setTimeout(() => dismissToast(toast.id), TOAST_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id]);

  const message = toast.count > 1 ? `${toast.message} ×${toast.count}` : toast.message;
  return (
    <BaseToast variant={toast.variant} message={message} onDismiss={() => dismissToast(toast.id)} />
  );
}

export function ToastStack() {
  const toasts = useToasts();
  const ref = useRef<HTMLDivElement>(null);

  // Promote the stack into the top layer once it's mounted (so it's never
  // clipped by a transformed/overflow ancestor and renders over the page chrome).
  // Guarded — degrades to the CSS-positioned, z-index stack where the Popover
  // API is absent.
  useEffect(() => {
    const el = ref.current;
    if (!el || !POPOVER_SUPPORTED || toasts.length === 0) return;
    try {
      if (el.popover !== "manual") el.popover = "manual";
      if (!el.matches(":popover-open")) el.showPopover();
    } catch {
      /* top layer unavailable */
    }
  }, [toasts]);

  if (toasts.length === 0) return null;
  return createPortal(
    <div ref={ref} className={styles.stack} aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}
