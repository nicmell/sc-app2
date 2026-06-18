// tmpfs (/dev/shm) I/O — the KEY contrast to the disk bench. scsynth's scope SHM
// segment (SuperColliderServer_<port>) lives here, RAM-backed, so this is the
// substrate the scope path actually reads. Expect GB/s + µs latencies regardless
// of how slow the SD card is. macOS has no /dev/shm → status "na" (not a failure).

import fs from "node:fs";
import os from "node:os";
import { fsBench } from "./disk.mjs";
import { round } from "../lib/stats.mjs";

const SHM = "/dev/shm";

export async function run(ctx) {
  if (os.platform() !== "linux" || !fs.existsSync(SHM)) {
    return {
      name: "tmpfs",
      unit: "MB/s",
      status: "na",
      metrics: {},
      path: SHM,
      notes: "no /dev/shm on this platform (Linux-only); the Pi tmpfs number is the relevant one",
    };
  }
  // tmpfs is RAM — a smaller file is plenty and avoids exhausting it.
  const sizeMB = Math.min(256, ctx.diskSize ?? 256);
  const m = fsBench(SHM, { sizeMB, quick: ctx.quick });
  return {
    name: "tmpfs",
    unit: "MB/s",
    status: "ok",
    metrics: { ...m, freeShmMB: round(shmFreeMB(), 0) },
    path: SHM,
    notes: "RAM-backed; this is where scsynth's scope SHM segment lives (fsync is a no-op)",
  };
}

function shmFreeMB() {
  try {
    // statfs-ish via df is overkill; just report total RAM-free as a proxy.
    return os.freemem() / 1024 / 1024;
  } catch {
    return 0;
  }
}
