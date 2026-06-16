import type { ReactNode } from "react";

/** A ui-components modal card on its centered, dimming backdrop. An `onClose`
 *  enables backdrop-click dismissal (clicks inside the card never dismiss);
 *  omit it for modals that must not be dismissed (e.g. the connection-error
 *  modal — nothing behind it is usable). */
export function Modal({ onClose, children }: { onClose?: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
