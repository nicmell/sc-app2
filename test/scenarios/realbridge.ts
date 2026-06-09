// Tier-2 scenario (no audio hardware): spawn the real Rust `serve` pointed at a
// fake scsynth, then drive the package's transport layer (InProcessOscClient)
// through a real session bootstrap. Proves session create + WS connect + /fail
// propagation through the actual Rust bridge end-to-end.
//
//   npx tsx scenarios/realbridge.ts
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import type { OscReply } from "../../src/types/protocol";
import { InProcessOscClient } from "../clients/InProcessOscClient";
import { startFakeScsynth } from "../fixtures/fakeScsynth.ts";
import { delay, httpBootstrap, ok, waitForServe } from "./lib.ts";

const PORT = 3999;
const FAKE = 57199;
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const base = `http://127.0.0.1:${PORT}`;

async function main() {
  const fake = await startFakeScsynth(FAKE);
  const configPath = fileURLToPath(new URL("./.realbridge-config.json", import.meta.url));
  writeFileSync(
    configPath,
    JSON.stringify({
      port: PORT,
      peers: [
        { name: "scsynth", pattern: "^/([sngbcdpu]_|notify|status|sync|cmd|dumpOSC|clearSched|error|quit|version)", target: `127.0.0.1:${FAKE}` },
        { name: "strudel", pattern: "^/(dirt|clock|scope)(/|$)", target: "127.0.0.1:57120" },
      ],
    }),
  );
  const serve = spawn(
    "cargo",
    ["run", "--manifest-path", "src-tauri/Cargo.toml", "--", "serve", "--config", configPath, "--log-dir", "./logs"],
    { cwd: repoRoot, stdio: "inherit" },
  );

  try {
    await waitForServe(base);
    // Bootstrap a session (POST /api/session) and open the WS via the real client.
    const { wsUrl } = await httpBootstrap(base)();
    const client = new InProcessOscClient(wsUrl);
    const replies: OscReply[] = [];
    client.onReply((r) => replies.push(r));
    await client.ready;
    ok(true, "client connected through the real bridge");

    await delay(2500); // a /status heartbeat round-trip
    ok(
      replies.some((r) => r.address === "/status.reply"),
      "received scsynth /status.reply through the bridge",
    );

    fake.emit("/fail", ["s", "s"], ["/s_new", "SynthDef not found"]);
    await delay(300);
    const fail = replies.find((r) => r.address === "/fail");
    ok(
      !!fail && fail.args[0] === "/s_new",
      "/fail propagated to the client",
    );

    client.dispose();
    await fake.close();
  } finally {
    serve.kill("SIGINT");
  }
  await delay(300);
  console.log(process.exitCode ? "FAILED" : "PASSED");
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => {
  console.error("scenario error", e);
  process.exit(1);
});
