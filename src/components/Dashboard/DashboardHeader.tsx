// Dashboard top bar: app title, live connection status, and the button that
// opens the plugin-management drawer. Adapted from upstream (dropped the
// transport play/stop, clock indicator and settings drawer — we have no per-node
// runtime or clock service here).
import { useStatus } from "../../state/session";
import type { ConnStatus } from "../../session/SessionManager";

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

export function DashboardHeader({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const status = useStatus();
  return (
    <header className="header">
      <span className="header-title">sc-app2</span>
      <span className="status-pill" data-variant={STATUS_VARIANT[status]}>
        {status}
      </span>
      <span className="header-spacer" />
      <button type="button" data-variant="secondary" data-size="sm" onClick={onToggleDrawer} aria-label="Manage plugins">
        Plugins
      </button>
    </header>
  );
}
