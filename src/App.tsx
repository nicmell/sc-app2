import { useEffect, useRef, useState } from "react";
import StrudelConsole from "./strudel/StrudelConsole";
import OscConsole from "./strudel/OscConsole";
import { bootstrapSession } from "./strudel/session";
import { connectOsc, type OscConnection, type OscLogEntry } from "./strudel/osc";
import "./App.css";

/** Max OSC-log entries kept in memory (oldest dropped). */
const MAX_LOG = 300;

export type ConnStatus = "connecting" | "connected" | "error";
/** A log entry plus a stable React key. */
export type LoggedEntry = OscLogEntry & { id: number };

function App() {
  const [osc, setOsc] = useState<OscConnection | null>(null);
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [log, setLog] = useState<LoggedEntry[]>([]);
  const nextId = useRef(0);

  // Own the session + WebSocket once; the Strudel console sends through it and
  // the OSC console displays the streamed log.
  useEffect(() => {
    let disposed = false;
    let conn: OscConnection | null = null;
    (async () => {
      try {
        const { wsUrl } = await bootstrapSession();
        conn = await connectOsc(wsUrl, {
          onLog: (entry) =>
            setLog((prev) => [...prev, { ...entry, id: nextId.current++ }].slice(-MAX_LOG)),
          onClose: () => {
            if (!disposed) setStatus("error");
          },
        });
        if (disposed) {
          conn.close();
          return;
        }
        setOsc(conn);
        setStatus("connected");
      } catch {
        if (!disposed) setStatus("error");
      }
    })();
    return () => {
      disposed = true;
      conn?.close();
    };
  }, []);

  return (
    <div className="app">
      <StrudelConsole osc={osc} status={status} />
      <OscConsole entries={log} />
    </div>
  );
}

export default App;
