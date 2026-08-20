// Drift guard: the committed Rust validator artifact must equal the generator's
// output. Fails if a spec or the fixed HTML vocabulary changed without
// re-running `yarn generate:specs`, or if the JSON was hand-edited. Regenerate
// to fix.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateSpecs } from "../../../scripts/generate-specs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SPECS = resolve(REPO, "src-tauri/crates/sc-validate/specs.json");

describe("specs generation", () => {
  it("the committed artifact is up to date with the specs (run `yarn generate:specs`)", async () => {
    expect(await generateSpecs()).toBe(readFileSync(SPECS, "utf8"));
  });
});
