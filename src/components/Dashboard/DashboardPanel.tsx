// A single grid cell. Rendered DIRECTLY as a react-grid-layout child, so it must
// forward the `ref`, `style` (absolute position/size) and `className`
// (`react-grid-item`) the grid injects — that wiring is what makes the panel
// draggable/resizable. The header is the drag handle (`.dashboard-panel-header`);
// its buttons stop mousedown from starting a drag. Faithful to upstream minus the
// run/log controls (we have no per-node runtime yet).
import type { CSSProperties, ReactNode, Ref } from "react";

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
        <button
          type="button"
          data-variant="ghost"
          data-size="sm"
          onMouseDown={stopDrag}
          onClick={onEdit}
          aria-label="Change plugin"
        >
          &#8943;
        </button>
        <button
          type="button"
          data-variant="ghost"
          data-size="sm"
          onMouseDown={stopDrag}
          onClick={onClose}
          aria-label="Close panel"
        >
          &times;
        </button>
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </div>
  );
}
