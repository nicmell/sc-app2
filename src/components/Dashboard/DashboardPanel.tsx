// A single grid cell. Rendered DIRECTLY as a react-grid-layout child, so it must
// forward the `ref`, `style` (absolute position/size) and `className`
// (`react-grid-item`) the grid injects — that wiring is what makes the panel
// draggable/resizable. The header is the drag handle (`.dashboard-panel-header`);
// its buttons stop mousedown from starting a drag. Faithful to upstream minus the
// run/log controls (we have no per-node runtime yet).
import type { CSSProperties, ReactNode, Ref } from "react";
import { ScButton } from "@sc-app/ui-components/react";

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
      className={["dashboard-panel", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className="dashboard-panel-header">
        <span className="dashboard-panel-title">{title}</span>
        <ScButton
          variant="ghost"
          size="sm"
          iconOnly
          icon="dots-three"
          label="Change plugin"
          onMouseDown={stopDrag}
          onClick={onEdit}
        />
        <ScButton
          variant="ghost"
          size="sm"
          iconOnly
          icon="x"
          label="Close panel"
          onMouseDown={stopDrag}
          onClick={onClose}
        />
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </div>
  );
}
