import type { ReactNode } from "react";
// The generic modal wrapper is imported aliased so this app-level convenience
// component can keep the `Modal` name.
import { Modal as BaseModal, Flex } from "@/components/ui";
// The modal-content class map (title/body/actions) stays private: callers
// author content through the structured props, not raw class names.
import styles from "./Modal.module.scss";

/** A ui-components modal card in the browser top layer (native <dialog> via
 *  <sc-base-modal>) with structured content slots: `title` renders the heading,
 *  `description` the dimmed body copy, `actions` the trailing button cluster,
 *  and children pass through untouched (lists, forms — anything). An `onClose`
 *  enables Esc + backdrop-click dismissal (clicks inside the card never
 *  dismiss); omit it for modals that must not be dismissed (e.g. a boot error —
 *  nothing behind it is usable). `label` overrides the dialog's accessible
 *  name when it should differ from `title`. */
export function Modal({
  onClose,
  label,
  title,
  description,
  actions,
  children,
}: {
  onClose?: () => void;
  label?: string;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <BaseModal open dismissable={onClose != null} label={label ?? title} onClose={onClose}>
      {title != null && <h2 className={styles.title}>{title}</h2>}
      {description != null && <p className={styles.body}>{description}</p>}
      {children}
      {actions != null && (
        <Flex wrap align="center" gap="xs" className={styles.actions}>
          {actions}
        </Flex>
      )}
    </BaseModal>
  );
}
