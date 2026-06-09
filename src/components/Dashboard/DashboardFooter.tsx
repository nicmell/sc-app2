// Dashboard status bar: the debug-log drawer toggle on the left, scsynth's
// live load (CPU + sample rate) on the right. The status comes from scsynth's
// `/status.reply` heartbeat, which the Rust bridge polls and forwards over the
// OSC bridge; until the first reply (or with no backend) we fall back to the
// connection state.
import { useState } from "react";
import { useStatus, useScsynthStatus } from "../../state/session";
import type { ScsynthStatus } from "../../session/SessionManager";
import { DebugLog } from "./DebugLog";

function formatStatus(s: ScsynthStatus): string {
  return `CPU: ${s.avgCpu.toFixed(1)}% / ${s.peakCpu.toFixed(1)}% | SR: ${s.sampleRate.toFixed(0)} Hz`;
}

export function DashboardFooter() {
  const conn = useStatus();
  const scsynth = useScsynthStatus();
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <footer className="footer" data-debug-open={debugOpen}>
      <DebugLog open={debugOpen} onToggle={() => setDebugOpen((o) => !o)} />
      <span className="server-status">{scsynth ? formatStatus(scsynth) : conn}</span>
    </footer>
  );
}
