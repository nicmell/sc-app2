// OSC console — displays the OSC log (sent + received) from the session store,
// streamed via the worker over the WebSocket. Pure presentational.

import { useEffect, useRef } from "react";
import { useOscLog } from "../state/SessionContext";

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const hms = d.toLocaleTimeString([], { hour12: false });
  return `${hms}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export default function OscConsole() {
  const entries = useOscLog();
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the newest entry, like a terminal.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  return (
    <section className="osc-console">
      <header className="osc-header">
        <h2>OSC console</h2>
        <span className="osc-count">{entries.length}</span>
      </header>
      <div className="osc-log">
        {entries.length === 0 && <div className="osc-empty">waiting for OSC traffic…</div>}
        {entries.map((e) => (
          <div key={e.id} className={`osc-row osc-${e.dir}`}>
            <span className="osc-time">{fmtTime(e.ts)}</span>
            <span className="osc-dir">{e.dir.toUpperCase()}</span>
            <span className="osc-addr">{e.address}</span>
            <span className="osc-args">{e.args.join(" ")}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}
