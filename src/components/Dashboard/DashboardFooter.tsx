// Dashboard status bar: scsynth's live load (CPU + sample rate) on the right.
// The status comes from scsynth's `/status.reply` heartbeat, which the Rust
// bridge polls and forwards over the OSC bridge; until the first reply (or
// with no backend) we fall back to the connection state.
import { useStatus, useScsynthStatus } from "../../state/session";
import type { ScsynthStatus } from "../../session/SessionManager";

function formatStatus(s: ScsynthStatus): string {
  return `CPU: ${s.avgCpu.toFixed(1)}% / ${s.peakCpu.toFixed(1)}% | SR: ${s.sampleRate.toFixed(0)} Hz`;
}

export function DashboardFooter() {
  const conn = useStatus();
  const scsynth = useScsynthStatus();

  return (
    <footer className="footer">
      <span className="server-status">{scsynth ? formatStatus(scsynth) : conn}</span>
    </footer>
  );
}
