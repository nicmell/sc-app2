// The e2e entrypoint: `yarn e2e [suites…] [--attach]`.
//   yarn e2e            → package, boot the whole stack on a THROWAWAY app
//                         root, run every suite, tear down. Exit = verdict.
//   yarn smoke          → the boot suite alone (alias for `e2e boot`).
//   yarn e2e --attach   → run against an ALREADY-RUNNING stack (yarn serve +
//                         yarn dev + yarn osc), reusing a :9222 Chrome when
//                         present — fast iteration; uploads REPLACE
//                         same-named plugins in the attached root.
// A suite exports `run(ctx) → [{name, ok, detail}]`; a thrown suite becomes
// a failed row and the remaining suites still run (independent evidence).
import { execSync } from "node:child_process";
import { join } from "node:path";
import { REPO, attachStack, bootStack, teardown } from "./stack.mjs";

const SUITES = {
  boot: () => import("./suites/boot.mjs"),
  examples: () => import("./suites/examples.mjs"),
};

const args = process.argv.slice(2);
const attach = args.includes("--attach");
const requested = args.filter((a) => !a.startsWith("--"));
for (const name of requested) {
  if (!SUITES[name]) {
    console.error(`unknown suite "${name}" (have: ${Object.keys(SUITES).join(", ")})`);
    process.exit(1);
  }
}
const selection = requested.length ? requested : Object.keys(SUITES);

// The packaged zips are the upload currency — fresh whenever a selected
// suite uploads (the guarantee they match the sources being iterated on).
if (selection.includes("examples")) {
  execSync(join(REPO, "scripts", "package-plugins.sh"), { cwd: REPO, stdio: "inherit" });
}

let failed = false;
try {
  if (attach) await attachStack();
  else await bootStack();

  const ctx = { attach };
  for (const name of selection) {
    let rows;
    try {
      const suite = await SUITES[name]();
      rows = await suite.run(ctx);
    } catch (e) {
      rows = [{ name: `${name} — crashed`, ok: false, detail: e.message }];
    }
    console.log(`\n=== ${name} ===`);
    for (const r of rows) {
      const mark = r.ok ? "ok " : "*** UNEXPECTED ***";
      console.log(`${r.name.padEnd(36)} ${mark.padEnd(20)}${r.detail ? " | " + r.detail : ""}`);
      if (!r.ok) failed = true;
    }
  }
} catch (e) {
  console.error(`[e2e] ${e.message}`);
  failed = true;
} finally {
  teardown();
}

console.log(`\n${failed ? "FAILED" : "OK"}`);
process.exit(failed ? 1 : 0);
