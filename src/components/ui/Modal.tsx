import type { ReactNode } from "react";
import { ScModal } from "@sc-app/ui-components/react";

/** A ui-components modal card in the browser top layer (native <dialog> via
 *  <sc-modal-base>). An `onClose` enables Esc + backdrop-click dismissal (clicks
 *  inside the card never dismiss); omit it for modals that must not be dismissed
 *  (e.g. the connection-error modal — nothing behind it is usable). `label` is
 *  the dialog's accessible name (→ aria-label). */
export function Modal({
  onClose,
  label,
  children,
}: {
  onClose?: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <ScModal open dismissable={onClose != null} label={label} onClose={onClose}>
      {children}
    </ScModal>
  );
}
