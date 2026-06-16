// Dashboard top bar: app title, live connection status, and the button that
// opens the plugin-management drawer. Adapted from upstream (dropped the
// transport play/stop, clock indicator and settings drawer — we have no per-node
// runtime or clock service here).
import { ScButton, ScChip } from "@sc-app/ui-components/react";
import { useStatus } from "@/stores/session";
import type { ConnStatus } from "@/types/stores";

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
      <ScChip dot variant={STATUS_VARIANT[status]} label={status} />
      <span className="header-spacer" />
      <ScButton variant="secondary" size="sm" label="Plugins" onClick={onToggleDrawer} />
    </header>
  );
}
