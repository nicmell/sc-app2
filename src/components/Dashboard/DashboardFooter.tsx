// Dashboard status bar: scsynth's address on the left (from the session
// response), its live load (CPU + sample rate) on the right. The status comes
// from scsynth's `/status.reply` heartbeat, which the Rust bridge polls and
// forwards over the OSC bridge; until the first reply (or with no backend) we
// fall back to the connection state.
import { useStatus, useScsynthAddress } from "@/stores/session";
import { useScsynthStatus } from "@/stores/osc";
import type { ScsynthStatus } from "@/types/stores";

function formatStatus(s: ScsynthStatus): string {
  return `CPU: ${s.avgCpu.toFixed(1)}% / ${s.peakCpu.toFixed(1)}% | SR: ${s.sampleRate.toFixed(0)} Hz`;
}

export function DashboardFooter() {
  const conn = useStatus();
  const scsynth = useScsynthStatus();
  const address = useScsynthAddress();

  return (
    <footer className="footer">
      <span className="server-address">{address ?? ""}</span>
      <span className="server-status">{scsynth ? formatStatus(scsynth) : conn}</span>
    </footer>
  );
}
