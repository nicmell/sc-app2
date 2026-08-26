// One-shot e2e: package the examples, boot the WHOLE stack against a
// THROWAWAY app root (serve + vite + scsynth/sclang + a fresh-profile
// headless Chrome), run the validation harness, tear everything down.
// Exit code = the harness verdict. Nothing touches the developer's appdir
// or the canonical app root.
import { spawn, execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = new URL("..", import.meta.url).pathname;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const children = [];
function boot(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: REPO,
    detached: true, // own process group — teardown kills the whole tree
    stdio: "ignore",
    ...options,
  });
  child.on("error", (e) => console.error(`[e2e] ${label} failed to start:`, e.message));
  children.push({ label, child });
  return child;
}

function teardown() {
  for (const { child } of children.reverse()) {
    try {
      process.kill(-child.pid);
    } catch {
      /* already gone */
    }
  }
  // start-osc.sh spawns scsynth/sclang grandchildren of its own.
  try {
    execSync("pkill -f scsynth; pkill -f sclang", { stdio: "ignore" });
  } catch {
    /* none running */
  }
}
process.on("exit", teardown);
process.on("SIGINT", () => process.exit(130));

async function until(label, probe, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await probe()) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error(`[e2e] timed out waiting for ${label}`);
  process.exit(1);
}

// 1. Fresh packaged zips.
execSync(join(REPO, "scripts", "package-plugins.sh"), { cwd: REPO, stdio: "inherit" });

// 2. The stack, on a throwaway root.
const root = mkdtempSync(join(tmpdir(), "sc-e2e-root-"));
console.log(`[e2e] app root: ${root}`);
boot("serve", "cargo", ["run", "--manifest-path", "src-tauri/Cargo.toml", "--", "serve"], {
  env: { ...process.env, SC_APP_DIR: root },
});
boot("vite", "yarn", ["dev"]);
boot("osc", join(REPO, "scripts", "start-osc.sh"), []);
boot("chrome", CHROME, [
  "--headless=new",
  "--remote-debugging-port=9222",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "sc-e2e-chrome-"))}`,
  "--no-first-run",
  "about:blank",
]);

// 3. Health: a session mint proves serve + scsynth registration; vite and
//    the CDP endpoint prove the rest.
await until("serve + scsynth", async () => {
  const r = await fetch("http://127.0.0.1:3000/api/session", { method: "POST" });
  return r.status === 201;
});
await until("vite", async () => (await fetch("http://localhost:1420/")).ok);
await until("chrome CDP", async () => (await fetch("http://127.0.0.1:9222/json/version")).ok);

// 4. The harness (inherits stdio — its report is the output).
const harness = spawn(process.execPath, [join(REPO, "scripts", "validate-examples.mjs")], {
  cwd: REPO,
  stdio: "inherit",
});
const code = await new Promise((resolve) => harness.on("close", resolve));
process.exit(code ?? 1);
