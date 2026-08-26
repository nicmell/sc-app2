// A single grid cell. Rendered DIRECTLY as a react-grid-layout child, so it must
// forward the `ref`, `style` (absolute position/size) and `className`
// (`react-grid-item`) the grid injects — that wiring is what makes the panel
// draggable/resizable. The header is the drag handle (`.dashboard-panel-header`);
// its buttons stop mousedown from starting a drag.
import type { CSSProperties, ReactNode, Ref } from "react";
import { Button, Text } from "@/components/ui";
import styles from "./DashboardPanel.module.scss";

/** The panel header's (scoped) class — the grid's drag handle. Dashboard passes
 *  it to react-grid-layout's `dragConfig.handle`, so the selector must match the
 *  real hashed class name, not a literal string. */
export const dragHandleClass = styles.header;

interface DashboardPanelProps {
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  onEdit?: () => void;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
  className?: string;
}

/** Keep a header-button interaction from starting a grid drag. */
const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

export function DashboardPanel(props: DashboardPanelProps) {
  const { title, children, onClose, onEdit, ref, style, className, ...rest } = props;
  return (
    <div
      ref={ref}
      style={style}
      className={[styles.panel, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className={styles.header}>
        <Text as="span" size="xs" tone="dim" transform="uppercase">
          {title}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon="dots-three"
          label="Change plugin"
          onMouseDown={stopDrag}
          onClick={onEdit}
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon="x"
          label="Close panel"
          onMouseDown={stopDrag}
          onClick={onClose}
        />
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
