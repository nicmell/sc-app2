// The Strudel console — the app's primary panel.
//
// Mounts a StrudelMirror editor whose evaluated patterns are emitted as
// `/dirt/play` OSC bundles over the bridge WebSocket → StrudelDirt. The WS
// connection is owned by App and passed in via `osc`; scheduling uses a plain
// monotonic clock (`performance.now()`) with a +200 ms safety lookahead.

import { useEffect, useRef, useState } from "react";
import { StrudelMirror } from "@strudel/codemirror";
import { transpiler } from "@strudel/transpiler";
import { ensureStrudelGlobals } from "./prebake";
import { dirtPlayBytes, type DirtEvent, type OscConnection } from "./osc";
import type { ConnStatus } from "../App";

// SuperDirt schedules by the bundle's NTP timetag; give it a little headroom
// so events land just in the future rather than in the (already-played) past.
const SAFETY_LOOKAHEAD_MS = 200;

const DEFAULT_CODE = `// Strudel — patterns route through StrudelDirt via the OSC bridge.
// Edit, then press Play (or Ctrl+Enter). Stop with the button (or Ctrl+.).
s("bd hh*2 sd hh")`;

export default function StrudelConsole({
  osc,
  status,
}: {
  osc: OscConnection | null;
  status: ConnStatus;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mirrorRef = useRef<InstanceType<typeof StrudelMirror> | null>(null);
  const [detail, setDetail] = useState("");
  const [playing, setPlaying] = useState(false);

  // Mount the editor once the WS connection is available.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !osc) return;
    const connection = osc;

    // Each Hap onset → a /dirt/play bundle. `targetTimeSecs` is in the
    // getTime() timebase (performance.now seconds); re-anchor to wall clock.
    const defaultOutput = (
      hap: { value: unknown },
      _deadline: number,
      _duration: number,
      _cps: number,
      targetTimeSecs: number,
    ) => {
      const value = hap.value;
      if (!value || typeof value !== "object") return;
      const event: DirtEvent = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === "string" || typeof v === "number") event[k] = v;
      }
      if (!event.s) return; // no sample → nothing for SuperDirt
      const timetag = Math.round(
        Date.now() + targetTimeSecs * 1000 - performance.now() + SAFETY_LOOKAHEAD_MS,
      );
      connection.send(dirtPlayBytes(event, timetag));
    };

    const mirror = new StrudelMirror({
      root,
      initialCode: DEFAULT_CODE,
      defaultOutput,
      getTime: () => performance.now() / 1000,
      transpiler,
      prebake: () => ensureStrudelGlobals().then(() => undefined),
      bgFill: false,
      solo: false,
      onToggle: (started: boolean) => setPlaying(started),
      onEvalError: (err: Error) => setDetail(err.message),
      afterEval: () => setDetail(""),
    });
    mirrorRef.current = mirror;

    return () => {
      void mirror.stop();
      mirror.clear();
      mirrorRef.current = null;
    };
  }, [osc]);

  return (
    <section className="strudel">
      <header className="strudel-header">
        <h1>sc-app2 · strudel</h1>
        <span className={`status status-${status}`}>{status}</span>
        <button
          type="button"
          onClick={() => mirrorRef.current?.evaluate()}
          disabled={status !== "connected"}
        >
          {playing ? "Update" : "Play"}
        </button>
        <button type="button" onClick={() => mirrorRef.current?.stop()} disabled={!playing}>
          Stop
        </button>
      </header>
      <div ref={rootRef} className="strudel-editor" />
      {detail && <p className="strudel-detail">{detail}</p>}
    </section>
  );
}
