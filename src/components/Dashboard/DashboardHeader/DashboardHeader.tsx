// Dashboard top bar: app title, live connection status, and the button that
// opens the plugin-management drawer.
import { Button, Chip } from "@/components/ui";
import { useStatus } from "@/stores/session";
import type { ConnStatus } from "@/types/stores";
import styles from "./DashboardHeader.module.scss";

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

export function DashboardHeader({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const status = useStatus();
  return (
    <header className={styles.header}>
      <span className={styles.title}>sc-app2</span>
      <Chip dot variant={STATUS_VARIANT[status]} label={status} />
      <span className={styles.spacer} />
      <Button variant="secondary" size="sm" label="Plugins" onClick={onToggleDrawer} />
    </header>
  );
}
