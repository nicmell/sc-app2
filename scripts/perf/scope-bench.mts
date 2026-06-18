// End-to-end live scope benchmark — the most direct measure of scope lag.
// Mints a session, opens the OSC WebSocket, stands up a REAL ScopeOut2 tap (the
// byte-identical SynthDef the app uses), subscribes, and times /scope/chunk
// arrival rate + inter-arrival jitter. Run via tsx (it imports the TS workspace
// packages + the tap-def compiler):
//
//   node_modules/.bin/tsx scripts/perf/scope-bench.mts \
//       [--host 127.0.0.1] [--port 3000] [--proxied] [--duration 15000]
//       [--channels 2] [--chunk-size 1024] [--sample-rate 48000]
//
// Targets to compare: local --port 3000 (direct), local --proxied (:1420, Vite
// hop), and Mac→Pi --host <pi-ip> (WiFi hop). Needs scsynth + the app server up.
// Prints one JSON object to stdout; diagnostics to stderr. Cleans up its tap.

import {
  encode,
  decode,
  isMessage,
  isBundle,
  gNewOne,
  dRecv,
  sNew,
  nFree,
  dFree,
  sync,
  AddToTail,
  scopeSubscribe,
  scopeUnsubscribe,
  SCOPE_CHUNK_ADDRESS,
  ADDR_SYNCED,
  ADDR_N_GO,
  Synced,
  NodeEvent,
} from "@sc-app/server-commands";
import {
  compileScopeTapSynthDef,
  scopeTapSynthDefName,
} from "../../src/lib/scope/scopeTapSynthDef.ts";
import { parseArgs, describe, round } from "./lib/stats.mjs";

const a = parseArgs(process.argv.slice(2), {});
const proxied = !!a.proxied;
const cfg = {
  host: typeof a.host === "string" ? a.host : "127.0.0.1",
  port: typeof a.port === "number" ? a.port : proxied ? 1420 : 3000,
  proxied,
  durationMs: typeof a.duration === "number" ? a.duration : 15000,
  channels: typeof a["channels"] === "number" ? a["channels"] : 2,
  chunkSize: typeof a["chunk-size"] === "number" ? a["chunk-size"] : 1024,
  sampleRate: typeof a["sample-rate"] === "number" ? a["sample-rate"] : 48000,
};
const REPLY_TIMEOUT = 3000;
const FIRST_CHUNK_TIMEOUT = 4000;
const base = `http://${cfg.host}:${cfg.port}`;
const log = (s: string) => process.stderr.write(s + "\n");

type Msg = { address: string; args: any[] };
function eachMessage(packet: any, cb: (m: Msg) => void): void {
  if (isBundle(packet)) for (const el of packet.bundleElements) eachMessage(el, cb);
  else if (isMessage(packet)) cb({ address: packet.address, args: packet.args ?? [] });
}

async function main() {
  const out: any = {
    schemaVersion: 1,
    target: { host: cfg.host, port: cfg.port, proxied: cfg.proxied },
    platform: { os: process.platform, arch: process.arch, node: process.version, hostname: (await import("node:os")).hostname() },
    config: cfg,
    ok: false,
    error: null,
  };
  const mark = () => process.hrtime.bigint();
  const since = (t: bigint) => Number(process.hrtime.bigint() - t) / 1e6;

  // 1. Mint session.
  let session: any;
  {
    const t = mark();
    const res = await fetch(`${base}/api/session`, { method: "POST" });
    if (!res.ok) throw new Error(`POST /api/session → ${res.status} (scsynth/server not ready?)`);
    session = await res.json();
    out.setup = { sessionMintMs: round(since(t)) };
    out.session = {
      sessionId: session.sessionId,
      sessionGroupId: session.sessionGroupId,
      nodeIdBase: session.nodeIdBase,
      scopeIndexBase: session.scopeIndexBase,
    };
  }

  // 2. Open WS.
  const wsUrl = `ws://${cfg.host}:${cfg.port}/ws?session=${session.sessionId}`;
  out.target.wsUrl = wsUrl;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = "arraybuffer";

  // reply waiters + chunk handler over the bare socket.
  const waiters: { address: string; match: (m: Msg) => boolean; resolve: () => void; reject: (e: any) => void; timer: any }[] = [];
  let onChunk: ((m: Msg) => void) | null = null;
  ws.onmessage = (ev: MessageEvent) => {
    const bytes = new Uint8Array(ev.data as ArrayBuffer);
    let packet;
    try {
      packet = decode(bytes);
    } catch {
      return;
    }
    eachMessage(packet, (m) => {
      if (m.address === SCOPE_CHUNK_ADDRESS) {
        onChunk?.(m);
        return;
      }
      for (let i = waiters.length - 1; i >= 0; i--) {
        const w = waiters[i];
        if (m.address === w.address && w.match(m)) {
          clearTimeout(w.timer);
          waiters.splice(i, 1);
          w.resolve();
        }
      }
    });
  };
  const send = (packet: any) => ws.send(encode(packet));
  const waitFor = (address: string, match: (m: Msg) => boolean, ms: number, what: string) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = waiters.findIndex((w) => w.timer === timer);
        if (idx >= 0) waiters.splice(idx, 1);
        reject(new Error(`timeout waiting for ${what} (${address})`));
      }, ms);
      waiters.push({ address, match, resolve, reject, timer });
    });

  {
    const t = mark();
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket failed to open"));
    });
    out.setup.wsConnectMs = round(since(t));
  }

  let nextNodeId = session.nodeIdBase;
  const defName = scopeTapSynthDefName(cfg.channels, cfg.chunkSize);
  let tapId = 0;
  let subId = 1;
  const arrivals: number[] = [];
  let firstChunkAt = 0;
  let ticks: number[] = [];

  try {
    // 3. /g_new session group at root tail (mirrors OscClient.connect).
    send(gNewOne(session.sessionGroupId, AddToTail, 0));

    // 4. /d_recv tap + embedded /sync, await /synced.
    {
      const syncId = nextNodeId++;
      const tapBytes = compileScopeTapSynthDef(cfg.channels, cfg.chunkSize);
      const t = mark();
      const w = waitFor(ADDR_SYNCED, (m) => Synced.syncId(m as any) === syncId, REPLY_TIMEOUT, "/synced");
      send(dRecv(tapBytes, encode(sync(syncId))));
      await w;
      out.setup.dRecvSyncedMs = round(since(t));
    }

    // 5. /s_new tap at session-group tail, await /n_go.
    {
      tapId = nextNodeId++;
      const t = mark();
      const w = waitFor(ADDR_N_GO, (m) => NodeEvent.nodeId(m as any) === tapId, REPLY_TIMEOUT, "/n_go");
      send(sNew(defName, tapId, AddToTail, session.sessionGroupId, { inBus: 0, scopeNum: session.scopeIndexBase }));
      await w;
      out.setup.sNewNGoMs = round(since(t));
    }

    // 6. Subscribe; register handler first (no arrival race).
    const subStart = mark();
    onChunk = (m) => {
      const now = performance.now();
      if (!firstChunkAt) {
        firstChunkAt = now;
        out.setup.subscribeToFirstChunkMs = round(since(subStart));
      } else {
        arrivals.push(now);
      }
      ticks.push(m.args[1] as number);
    };
    send(scopeSubscribe({ subId, scope: session.scopeIndexBase, channels: cfg.channels, chunkSize: cfg.chunkSize }));

    // 7. Collect.
    await new Promise((r) => setTimeout(r, cfg.durationMs));

    // 8. Metrics.
    if (!firstChunkAt) {
      out.error = "no /scope/chunk received (tap/slot/scsynth issue) — setup ok but zero chunks";
      throw new Error(out.error);
    }
    // inter-arrival deltas (ms) over arrivals incl. first
    const all = [firstChunkAt, ...arrivals];
    const deltas: number[] = [];
    for (let i = 1; i < all.length; i++) deltas.push(all[i] - all[i - 1]);
    const collectedMs = all[all.length - 1] - firstChunkAt;
    const chunks = all.length;
    const expected = cfg.sampleRate / cfg.chunkSize;
    const expectedIntervalMs = 1000 / expected;
    const j = describe(deltas);
    const estimatedDrops = deltas.reduce((s, d) => s + Math.max(0, Math.round(d / expectedIntervalMs) - 1), 0);
    const tickContig = ticks.every((v, i) => i === 0 || v === ticks[i - 1] + 1);

    out.throughput = {
      chunksReceived: chunks,
      collectedMs: round(collectedMs),
      chunksPerSec: round(chunks / (collectedMs / 1000)),
      expectedChunksPerSec: round(expected),
      rateRatio: round(chunks / (collectedMs / 1000) / expected),
    };
    out.jitterMs = {
      mean: round(j.mean),
      p50: round(j.p50),
      p95: round(j.p95),
      p99: round(j.p99),
      max: round(j.max),
      stddev: round(j.stddev),
      expectedIntervalMs: round(expectedIntervalMs),
    };
    out.integrity = { estimatedDrops, tickIndexContiguous: tickContig };
    out.ok = true;
  } catch (e: any) {
    out.ok = out.ok || false;
    out.error = out.error ?? String(e?.message ?? e);
  } finally {
    // teardown — prevent orphan tap synths on a long-lived server.
    try {
      if (ws.readyState === ws.OPEN) {
        send(scopeUnsubscribe(subId));
        if (tapId) send(nFree(tapId));
        send(dFree(defName));
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch {}
    try {
      ws.close();
    } catch {}
  }

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  if (out.ok) {
    log(
      `summary [${cfg.host}:${cfg.port}${cfg.proxied ? " via-vite" : ""}] ` +
        `${out.throughput.chunksPerSec}/${out.throughput.expectedChunksPerSec} chunks/s, ` +
        `jitter p95=${out.jitterMs.p95}ms (expect ~${out.jitterMs.expectedIntervalMs})`,
    );
  } else {
    log(`FAILED: ${out.error}`);
  }
  process.exit(out.ok ? 0 : 1);
}

main().catch((e) => {
  log(`fatal: ${e?.stack ?? e}`);
  process.exit(1);
});
