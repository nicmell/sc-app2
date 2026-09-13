// Dashboard top bar: app title, live connection status, the Conductor's
// podium (play/pause/stop, the cycle/M:SS position, the two-way BPM
// metronome — CONDUCTOR.md), the bridge-time clock, and the button that
// opens the plugin-management drawer.
import { useEffect, useReducer, useState } from "react";
import { Button, Chip } from "@/components/ui";
import { bpmToCps, conductor, cpsToBpm } from "@/lib/conductor/Conductor";
import { oscClient } from "@/lib/osc/OscClient";
import { useConductor } from "@/stores/conductor";
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

function formatPosition(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
}

/** The podium: transport buttons, the position readout (cycles + M:SS,
 *  re-rendered on the tick metronome while playing — the position
 *  itself is the conductor's, this only repaints), and the BPM input. */
function ConductorPodium() {
  const { state, cps } = useConductor();
  const [, bump] = useReducer((c: number) => c + 1, 0);
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  useEffect(
    () => (state === "playing" ? oscClient.clock.subscribe(100, bump) : undefined),
    [state],
  );
  const commitBpm = () => {
    if (bpmDraft !== null) conductor.setCps(bpmToCps(Number(bpmDraft)));
    setBpmDraft(null);
  };
  return (
    <span className={styles.podium}>
      {state === "playing" ? (
        <Button
          iconOnly
          icon="pause"
          label="Pause"
          size="sm"
          variant="ghost"
          onClick={() => conductor.pause()}
        />
      ) : (
        <Button
          iconOnly
          icon="play"
          label="Play"
          size="sm"
          variant="ghost"
          onClick={() => void conductor.play()}
        />
      )}
      <Button
        iconOnly
        icon="stop"
        label="Stop"
        size="sm"
        variant="ghost"
        disabled={state === "stopped"}
        onClick={() => conductor.stop()}
      />
      <span className={styles.position}>
        {conductor.cycle().toFixed(1)} · {formatPosition(conductor.seconds())}
      </span>
      <input
        className={styles.bpm}
        type="number"
        min={1}
        aria-label="BPM"
        value={bpmDraft ?? String(Math.round(cpsToBpm(cps)))}
        onChange={(e) => setBpmDraft(e.target.value)}
        onBlur={commitBpm}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <span className={styles.bpmLabel}>BPM</span>
    </span>
  );
}

export function DashboardHeader({ onToggleDrawer }: { onToggleDrawer: () => void }) {
  const status = useStatus();
  const clock = useClockStatus();
  const time = useBridgeClock();
  return (
    <header className={styles.header}>
      <span className={styles.title}>sc-app2</span>
      <Chip dot variant={STATUS_VARIANT[status]} label={status} />
      {status === "connected" && <ConductorPodium />}
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
