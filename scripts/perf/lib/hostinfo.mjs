// Host metadata for the JSON envelope. Everything best-effort — a missing field
// never aborts a run (the Pi has /proc, macOS does not).

import os from "node:os";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

function availableParallelism() {
  try {
    return os.availableParallelism();
  } catch {
    return os.cpus().length;
  }
}

/** Best-effort filesystem type backing `path`. /proc/mounts on Linux, df -T fallback. */
export function fsTypeFor(path) {
  try {
    const real = fs.realpathSync(path);
    if (fs.existsSync("/proc/mounts")) {
      const mounts = fs
        .readFileSync("/proc/mounts", "utf8")
        .split("\n")
        .map((l) => l.split(" "))
        .filter((p) => p.length >= 3 && real.startsWith(p[1]))
        .sort((a, b) => b[1].length - a[1].length); // longest mountpoint wins
      if (mounts.length) return mounts[0][2];
    }
    // macOS / fallback: `df` then `mount` to read the fs type.
    const dev = execFileSync("df", [real], { encoding: "utf8" }).trim().split("\n").pop().split(/\s+/)[0];
    const m = execFileSync("mount", [], { encoding: "utf8" })
      .split("\n")
      .find((l) => l.startsWith(dev + " "));
    const fsMatch = m && m.match(/\(([^,)]+)/);
    return fsMatch ? fsMatch[1] : "unknown";
  } catch {
    return "unknown";
  }
}

/** Pi SoC temperature in °C (Linux thermal zone), or null. */
export function cpuTempC() {
  try {
    const raw = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8").trim();
    return Math.round(Number(raw) / 100) / 10;
  } catch {
    return null;
  }
}

export function hostInfo() {
  const cpus = os.cpus();
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    osType: os.type(),
    osRelease: os.release(),
    cpuModel: cpus[0]?.model?.trim() ?? "unknown",
    cpuCount: cpus.length,
    availableParallelism: availableParallelism(),
    totalMemBytes: os.totalmem(),
    freeMemBytes: os.freemem(),
    loadAvg: os.loadavg(),
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    cpuTempStartC: cpuTempC(),
  };
}
