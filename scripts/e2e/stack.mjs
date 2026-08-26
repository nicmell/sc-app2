// Stack orchestration for the e2e framework: boot the whole dev stack
// against a throwaway app root (owned mode), or attach to an already-running
// one (fast iteration). Teardown kills ONLY what this process spawned —
// reverse-order process-GROUP kills, no pkill: start-osc.sh's
// non-interactive bash keeps scsynth + sclang in its own pgid (sclang via
// exec), and yarn/vite/cargo children inherit their group, so the group kill
// IS the scoped kill (a blanket pkill could kill a developer's own scsynth).
import { execSync, spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = fileURLToPath(new URL("../..", import.meta.url));
export const API = "http://127.0.0.1:3000";
export const APP = "http://localhost:1420";
export const CDP = "http://127.0.0.1:9222";
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const spawned = [];

function boot(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: REPO,
    detached: true, // own process group — teardown kills the whole tree
    stdio: "ignore",
    ...options,
  });
  child.on("error", (e) => console.error(`[e2e] ${label} failed to start:`, e.message));
  spawned.push({ label, child });
  return child;
}

function groupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Sync-safe (runs from process.on("exit")): TERM every spawned group in
 *  reverse boot order, wait briefly, KILL whatever still answers. */
export function teardown() {
  const groups = spawned.splice(0).reverse();
  for (const { child } of groups) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  if (groups.length === 0) return;
  // Bounded synchronous wait — Atomics.wait never yields to the event loop.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  for (const { child } of groups) {
    if (groupAlive(child.pid)) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* raced away */
      }
    }
  }
}
process.on("exit", teardown);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

async function until(label, probe, timeoutMs = 300_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await probe()) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`timed out waiting for ${label}`);
}

const viteUp = async () => (await fetch(`${APP}/`)).ok;
const cdpUp = async () => (await fetch(`${CDP}/json/version`)).ok;
/** Non-mutating serve+scsynth probe: a real /g_queryTree round-trip. (A
 *  session mint would leak a WS-less live session on an attached server.) */
const scsynthUp = async () => (await fetch(`${API}/api/diag/nodetree`)).ok;

function spawnChrome() {
  boot("chrome", CHROME, [
    "--headless=new",
    "--remote-debugging-port=9222",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "sc-e2e-chrome-"))}`,
    "--no-first-run",
    "about:blank",
  ]);
}

/** Boot serve (on a throwaway root) + vite + scsynth + a fresh-profile
 *  headless Chrome. Refuses when UDP 57110 is already bound — serve's bridge
 *  would silently register against that foreign scsynth, and teardown must
 *  never be in the position of having used (or killed) it. */
export async function bootStack() {
  let bound = "";
  try {
    // lsof exits non-zero when nothing matches — that's the port-free case.
    bound = execSync("lsof -nP -iUDP:57110", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    bound = "";
  }
  if (bound) {
    throw new Error(
      "UDP 57110 is already bound (a scsynth is running — yarn osc?). " +
        "Stop it, or use --attach to run against your own stack.",
    );
  }

  const appDir = mkdtempSync(join(tmpdir(), "sc-e2e-root-"));
  console.log(`[e2e] app root: ${appDir}`);
  boot("serve", "cargo", ["run", "--manifest-path", "src-tauri/Cargo.toml", "--", "serve"], {
    env: { ...process.env, SC_APP_DIR: appDir },
  });
  boot("vite", "yarn", ["dev"]);
  boot("osc", join(REPO, "scripts", "start-osc.sh"), []);
  spawnChrome();

  // A 201 mint proves serve AND scsynth registration (throwaway root, so the
  // leaked WS-less session is garbage anyway).
  await until("serve + scsynth", async () => {
    const r = await fetch(`${API}/api/session`, { method: "POST" });
    return r.status === 201;
  });
  await until("vite", viteUp);
  await until("chrome CDP", cdpUp);
  return { appDir };
}

/** Attach to an already-running stack (serve + vite + scsynth must be up —
 *  checked non-mutatingly); reuse a :9222 Chrome when present, else spawn
 *  our own (which teardown then owns). */
export async function attachStack() {
  await until("serve + scsynth (attach)", scsynthUp, 15_000);
  await until("vite (attach)", viteUp, 15_000);
  let chrome = false;
  try {
    chrome = await cdpUp();
  } catch {
    /* not running */
  }
  if (!chrome) {
    spawnChrome();
    await until("chrome CDP", cdpUp);
  }
  return { appDir: null };
}
