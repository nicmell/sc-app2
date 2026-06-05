import { useStatus } from "../state/session";
import { addBox } from "../state/layout";
import type { ConnStatus } from "../state/SessionController";

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

export function Header({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const status = useStatus();
  return (
    <header className="app-header">
      <h1 className="app-title">sc-app2</h1>
      <span className="status-pill" data-variant={STATUS_VARIANT[status]}>
        {status}
      </span>
      <span className="app-header-spacer" />
      <button type="button" data-variant="secondary" data-size="sm" onClick={addBox}>
        Add panel
      </button>
      <button type="button" data-variant="secondary" data-size="sm" onClick={onToggleDrawer}>
        Plugins
      </button>
    </header>
  );
}
