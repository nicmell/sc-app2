# Performance suite (`scripts/perf/`)

Cross-platform perf benchmarks for diagnosing scope lag and comparing the
Raspberry Pi against the dev Mac. Two parts:

- **Host micro-benchmarks** (`run.mjs`) — pure Node, zero-dep: CPU (single +
  multi-core), scope-style byte-swap, memory bandwidth, disk I/O, and `/dev/shm`
  tmpfs I/O. Run independently on each machine; emits comparable JSON.
- **End-to-end scope bench** (`scope-bench.mts`, via `tsx`) — drives the real
  WebSocket scope path (mints a session, stands up a `ScopeOut2` tap, subscribes)
  and measures actual `/scope/chunk` arrival rate + inter-arrival jitter.

## Why these benchmarks

The scope path reads scsynth's SHM segment in **`/dev/shm` (tmpfs = RAM)**, copies
an 8 KB slot every ~21 ms, byte-swaps it to big-endian (single-threaded bridge
poll), ships it over the WebSocket, and the client decodes per-float + draws on a
canvas. So the suspects are **CPU (single-core)**, **memory**, and **network
latency/jitter** — *not* the SD/SSD card (disk isn't in the scope path). The disk
vs tmpfs benches prove that contrast; the scope bench measures the real thing.

## Run it

Host micro-benchmarks (on the Pi AND on the Mac):

```bash
node scripts/perf/run.mjs --label "pi5"        # → perf-results/<host>-<arch>-<iso>.json
node scripts/perf/run.mjs --label "mac" --quick   # faster smoke run
# options: --only cpu-single,byteswap  --disk-size 1024  --mem-size 256  --stdout
```

End-to-end scope (needs scsynth + the app server running):

```bash
# on the Pi, direct server:
node_modules/.bin/tsx scripts/perf/scope-bench.mts --host 127.0.0.1 --port 3000 --duration 15000 > perf-results/scope-pi-direct.json
# on the Pi, through the Vite dev proxy (isolates the proxy hop):
node_modules/.bin/tsx scripts/perf/scope-bench.mts --proxied --duration 15000 > perf-results/scope-pi-vite.json
# from the Mac against the Pi over WiFi (isolates the network hop):
node_modules/.bin/tsx scripts/perf/scope-bench.mts --host 192.168.178.100 --port 3000 --duration 15000 > perf-results/scope-mac-to-pi.json
```

Compare + assessment:

```bash
node scripts/perf/report.mjs perf-results/*.json
```

(Optional `package.json` scripts: `yarn perf`, `yarn perf:report`, `yarn perf:scope`.)

## Notes & caveats

- **Disk numbers are cache-influenced** when the test file is smaller than RAM
  (we can't drop caches without root; macOS `fsync` ≠ `F_FULLFSYNC`). For
  authoritative uncached numbers use `fio --direct=1`; for raw network bandwidth
  use `iperf3`. The suite stays pure-Node for zero-install portability.
- **`/dev/shm`** is Linux-only — on macOS the tmpfs bench reports `status:"na"`.
  The Pi's tmpfs number is the one that matters for the scope diagnosis.
- The scope bench distinguishes a **setup error** from **0 chunks received**
  (the latter means the tap/slot/scsynth is wrong, not the network).
- The CPU kernel emits a **checksum** that must match across hosts; `report.mjs`
  warns if it differs (e.g. different Node/V8 majors → not comparable).
- Results land in `perf-results/` (gitignored).
