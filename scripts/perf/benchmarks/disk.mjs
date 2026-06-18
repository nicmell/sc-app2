// Disk I/O on the repo's filesystem (the SD/SSD card under question). Sequential
// write+fsync, sequential read, and random 512 B read latency (where SD cards —
// ms-class — diverge sharply from SSD — µs). NOTE: disk is NOT in the scope path
// (scope SHM is /dev/shm tmpfs); this characterizes the card, and the tmpfs bench
// is the contrast. Honestly flags cacheInfluenced (no root to drop caches; macOS
// fsync ≠ F_FULLFSYNC).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { nowNs, percentile, xorshift32, round } from "../lib/stats.mjs";

/** Core I/O bench against a directory. Reused by the tmpfs bench. */
export function fsBench(dir, { sizeMB = 1024, quick = false } = {}) {
  const mb = quick ? Math.min(128, sizeMB) : sizeMB;
  const bytes = mb * 1024 * 1024;
  const blockBytes = 4 * 1024 * 1024;
  const block = Buffer.allocUnsafe(blockBytes);
  for (let i = 0; i < blockBytes; i++) block[i] = i & 0xff;
  const file = path.join(dir, `.perf-disk-${process.pid}.tmp`);

  let fd;
  try {
    // Sequential write + fsync (durability — measure the device, not just cache).
    fd = fs.openSync(file, "w");
    let tW = nowNs();
    let written = 0;
    while (written < bytes) {
      fs.writeSync(fd, block, 0, Math.min(blockBytes, bytes - written));
      written += blockBytes;
    }
    fs.fsyncSync(fd);
    const writeMs = Number(process.hrtime.bigint() - tW) / 1e6;
    fs.closeSync(fd);
    fd = undefined;

    // Sequential read (cache-influenced when file < RAM).
    fd = fs.openSync(file, "r");
    const rbuf = Buffer.allocUnsafe(blockBytes);
    let tR = nowNs();
    let read = 0;
    while (read < bytes) {
      const n = fs.readSync(fd, rbuf, 0, blockBytes, read);
      if (n <= 0) break;
      read += n;
    }
    const readMs = Number(process.hrtime.bigint() - tR) / 1e6;

    // Random 512 B read latency (seeded offsets → identical pattern across hosts).
    const small = Buffer.allocUnsafe(512);
    const rnd = xorshift32(0xb10c5eed);
    const nReads = quick ? 1000 : 5000;
    const maxOff = bytes - 512;
    const lat = [];
    for (let i = 0; i < nReads; i++) {
      const off = Math.floor(rnd() * (maxOff / 512)) * 512;
      const t = process.hrtime.bigint();
      fs.readSync(fd, small, 0, 512, off);
      lat.push(Number(process.hrtime.bigint() - t) / 1000); // µs
    }
    fs.closeSync(fd);
    fd = undefined;

    const mbps = (ms) => bytes / (ms / 1000) / 1e6;
    return {
      sizeMB: mb,
      seqWriteMBs: round(mbps(writeMs)),
      seqReadMBs: round(mbps(readMs)),
      randReadP50us: round(percentile(lat, 50), 1),
      randReadP95us: round(percentile(lat, 95), 1),
      randReadP99us: round(percentile(lat, 99), 1),
      cacheInfluenced: bytes < os.totalmem(),
    };
  } finally {
    try {
      if (fd !== undefined) fs.closeSync(fd);
    } catch {}
    try {
      fs.rmSync(file, { force: true });
    } catch {}
  }
}

export async function run(ctx) {
  // Write inside the repo tree so we test the actual card, not os.tmpdir().
  const dir = process.cwd();
  const m = fsBench(dir, { sizeMB: ctx.diskSize ?? 1024, quick: ctx.quick });
  return {
    name: "disk",
    unit: "MB/s",
    status: "ok",
    metrics: m,
    path: dir,
    notes:
      (m.cacheInfluenced ? "cache-influenced (file<RAM); " : "") +
      "macOS fsync≠F_FULLFSYNC; disk is NOT in the scope path",
  };
}
