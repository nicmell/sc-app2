import type { ReactNode } from "react";
// The generic modal wrapper is imported aliased so this app-level convenience
// component can keep the `Modal` name.
import { Modal as BaseModal } from "@/components/ui";
import "./Modal.scss";

/** A ui-components modal card in the browser top layer (native <dialog> via
 *  <sc-base-modal>). An `onClose` enables Esc + backdrop-click dismissal (clicks
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
    <BaseModal open dismissable={onClose != null} label={label} onClose={onClose}>
      {children}
    </BaseModal>
  );
}
