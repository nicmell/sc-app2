// HTTP round-trip latency + jitter to a target server — the WiFi-path metric,
// measurable without the audio stack. Relational: only runs when --network
// <baseUrl> is given (loopback on the Pi = baseline; Mac→Pi over WiFi = the real
// test). Sequential keep-alive GETs (Node's fetch reuses the TCP connection, so
// this measures app-level RTT like the persistent scope WebSocket, not TCP
// setup). Bandwidth isn't the concern (~376 KB/s/scope) — jitter at the ~21 ms
// chunk cadence is what makes scopes choppy.

import { describe, round } from "../lib/stats.mjs";

export async function run(ctx) {
  const target = typeof ctx.network === "string" ? ctx.network : null;
  if (!target) {
    return {
      name: "network",
      unit: "ms",
      status: "skipped",
      metrics: {},
      notes: "pass --network <baseUrl> (e.g. http://192.168.178.100:1420) to measure RTT/jitter",
    };
  }
  const path = typeof ctx.netPath === "string" ? ctx.netPath : "/";
  const url = target.replace(/\/+$/, "") + path;
  const count = ctx.netCount ?? (ctx.quick ? 30 : 100);
  const warmup = 5;
  const timeoutMs = 5000;

  const probe = async () => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const t = process.hrtime.bigint();
    try {
      const res = await fetch(url, { signal: ac.signal });
      const buf = await res.arrayBuffer(); // drain body → full round trip
      return { ms: Number(process.hrtime.bigint() - t) / 1e6, status: res.status, bytes: buf.byteLength };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    for (let i = 0; i < warmup; i++) await probe();
    const rtts = [];
    let status = 0;
    let bytes = 0;
    for (let i = 0; i < count; i++) {
      const p = await probe();
      rtts.push(p.ms);
      status = p.status;
      bytes = p.bytes;
    }
    const d = describe(rtts);
    return {
      name: "network",
      unit: "ms",
      status: "ok",
      metrics: {
        target: url,
        count,
        rttMeanMs: round(d.mean, 2),
        rttP50Ms: round(d.p50, 2),
        rttP95Ms: round(d.p95, 2),
        rttP99Ms: round(d.p99, 2),
        rttMaxMs: round(d.max, 2),
        rttMinMs: round(d.min, 2),
        jitterStddevMs: round(d.stddev, 2),
        httpStatus: status,
        bodyBytes: bytes,
      },
      notes: `${count} keep-alive GETs to ${url}; jitter = stddev. Chunk cadence is ~21 ms.`,
    };
  } catch (e) {
    return {
      name: "network",
      unit: "ms",
      status: "error",
      metrics: { target: url },
      notes: `probe failed: ${e?.message ?? e}`,
    };
  }
}
