// Dashboard top bar: app title, live connection status, the bridge-time
// clock, and the button that opens the plugin-management drawer.
import { useEffect, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { oscClient } from "@/lib/osc/OscClient";
import { useClockStatus } from "@/stores/osc";
import { useStatus } from "@/stores/session";
import type { ConnStatus } from "@/types/stores";
import styles from "./DashboardHeader.module.scss";

const STATUS_VARIANT: Record<ConnStatus, "ok" | "warn" | "error"> = {
  connecting: "warn",
  connected: "ok",
  error: "error",
};

function formatBridgeTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** The bridge-time wall clock, re-read on a 1 s clock subscription — the
 *  audio engine's /tr ticks arrive via postMessage, which is never
 *  background-throttled, so it stays honest in an occluded window. */
function useBridgeClock(): string {
  const [time, setTime] = useState(() => formatBridgeTime(oscClient.clock.now()));
  useEffect(
    () => oscClient.clock.subscribe(1_000, () => setTime(formatBridgeTime(oscClient.clock.now()))),
    [],
  );
  return time;
}

export function DashboardHeader({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const status = useStatus();
  const clock = useClockStatus();
  const time = useBridgeClock();
  return (
    <header className={styles.header}>
      <span className={styles.title}>sc-app2</span>
      <Chip dot variant={STATUS_VARIANT[status]} label={status} />
      {status === "connected" && clock && (
        <span className={styles.clock}>
          {time} Δ{clock.offset >= 0 ? "+" : ""}
          {clock.offset.toFixed(1)}ms
        </span>
      )}
      <span className={styles.spacer} />
      <Button variant="secondary" size="sm" label="Plugins" onClick={onToggleDrawer} />
    </header>
  );
}
