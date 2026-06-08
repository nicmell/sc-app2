// In-app debug log, embedded in the footer. The toggle (· count) sits in the
// footer bar after the scsynth address; download/clear appear only while open.
// When expanded the footer bar lifts and the entry list docks to the bottom of
// the viewport *below* the bar — a drawer that hovers the dashboard without
// shrinking it. The panel is portaled to <body> so the footer's lift transform
// doesn't become its containing block (transform traps position:fixed children).
// Reads the console-mirror ring buffer from utils/debugLog. Ported from the old
// sc-app's DebugLog (console-mirror core; the scsynth /fail section is omitted).
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../state/useStore";
import { clearDebugLog, debugLog, type DebugEntry } from "../../utils/debugLog";

function formatEntries(entries: ReadonlyArray<DebugEntry>): string {
  return (
    entries
      .map((e) => `${(e.timestamp / 1000).toFixed(3).padStart(10)}  ${e.level.padEnd(5)}  ${e.text}`)
      .join("\n") + "\n"
  );
}

/** `sc-debug-YYYYMMDD-HHmmss.txt` — sortable, easy to grep. */
function buildFilename(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `sc-debug-${stamp}.txt`;
}

/** Download the buffer as a text file via an `<a href download>` blob URL —
 *  works in the browser and the Tauri webview alike. */
function downloadEntries(entries: ReadonlyArray<DebugEntry>): void {
  if (entries.length === 0) return;
  const blob = new Blob([formatEntries(entries)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000); // let Safari start the download
}

export function DebugLog({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const entries = useStore(debugLog);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [entries, open]);

  return (
    <span className="cluster debug-log-controls">
      <button
        type="button"
        data-variant="secondary"
        data-size="sm"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? "▾" : "▸"} debug log · {entries.length}
      </button>
      {open && (
        <>
          <button
            type="button"
            data-variant="ghost"
            data-size="sm"
            onClick={() => downloadEntries(entries)}
            disabled={entries.length === 0}
            title="Download the buffered log as a text file"
          >
            download
          </button>
          <button type="button" data-variant="ghost" data-size="sm" onClick={clearDebugLog}>
            clear
          </button>
        </>
      )}
      {open &&
        createPortal(
          <div className="debug-log-panel" ref={scroller}>
            {entries.length === 0 ? (
              <div className="debug-log-empty">no console output yet</div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="debug-log-entry" data-level={e.level}>
                  <span className="t">{(e.timestamp / 1000).toFixed(3)}</span>
                  <span className="l">{e.level}</span>
                  <span className="m">{e.text}</span>
                </div>
              ))
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
