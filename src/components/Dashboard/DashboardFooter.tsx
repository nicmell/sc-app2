// Dashboard status bar, faithful to the old sc-app: scsynth's address on the
// left, its live load (CPU + sample rate) on the right. The status comes from
// scsynth's `/status.reply` heartbeat, which the Rust bridge polls and forwards
// over the OSC bridge; until the first reply (or with no backend) we fall back
// to the connection state.
import { useEffect, useState } from "react";
import { useStatus, useScsynthStatus } from "../../state/session";
import type { ScsynthStatus } from "../../session/SessionManager";
import { fetchConfig } from "../../session/bootstrap";
import { DebugLog } from "./DebugLog";

function formatStatus(s: ScsynthStatus): string {
  return `CPU: ${s.avgCpu.toFixed(1)}% / ${s.peakCpu.toFixed(1)}% | SR: ${s.sampleRate.toFixed(0)} Hz`;
}

export function DashboardFooter() {
  const conn = useStatus();
  const scsynth = useScsynthStatus();
  const [address, setAddress] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    fetchConfig()
      .then((c) => {
        const peer = c.peers.find((p) => p.name === "scsynth");
        if (peer) setAddress(peer.target);
      })
      .catch(() => {
        /* no server (browser dev without `yarn serve`) — leave address blank */
      });
  }, []);

  return (
    <footer className="footer" data-debug-open={debugOpen}>
      <span className="server-address">{address}</span>
      <DebugLog open={debugOpen} onToggle={() => setDebugOpen((o) => !o)} />
      <span className="server-status">{scsynth ? formatStatus(scsynth) : conn}</span>
    </footer>
  );
}
