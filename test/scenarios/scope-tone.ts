// Tier-2 scenario (needs a running serve + REAL scsynth, since SHM scope data
// only the real server produces): drive the real controllers with the test-tone
// option, which injects a 220 Hz sine onto bus 0, and assert the scope chunks
// carry it. Run with your serve + scsynth/SuperDirt up:
//
//   SC_BASE=http://127.0.0.1:3000 npx tsx scenarios/scope-tone.ts
import { ScopeController } from "../../src/scope/ScopeController";
import { IdAllocator } from "../../src/session/IdAllocator";
import { InProcessOscClient } from "../clients/InProcessOscClient";
import { delay, httpBootstrap, ok, waitForServe } from "./lib.ts";

const base = process.env.SC_BASE ?? "http://127.0.0.1:3000";

async function main() {
  await waitForServe(base, 5000);
  const { wsUrl, sessionGroupId, nodeIdBase, nodeIdCount, scopeIndex } = await httpBootstrap(base)();
  const client = new InProcessOscClient(wsUrl);
  await client.ready;
  ok(true, "connected");

  // Start the master-out scope tap with the 220 Hz test tone injected onto bus 0.
  const scope = new ScopeController(
    client,
    sessionGroupId,
    new IdAllocator(nodeIdBase, nodeIdCount),
    scopeIndex,
    { testTone: true },
  );
  scope.start();

  // Let the tap + tone start and a few chunks arrive.
  let peak = 0;
  for (let i = 0; i < 40; i++) {
    await delay(100);
    const chunk = scope.chunkRef.current;
    if (chunk) for (const v of chunk.data) peak = Math.max(peak, Math.abs(v));
  }
  ok(peak > 0.05, `scope captured the test tone (peak=${peak.toFixed(3)})`);

  scope.dispose();
  client.dispose();
  console.log(process.exitCode ? "FAILED" : "PASSED");
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => {
  console.error("scenario error", e);
  process.exit(1);
});
