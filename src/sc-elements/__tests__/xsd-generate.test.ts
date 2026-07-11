// Drift guard: the committed sc-plugin-schema.xsd must equal the generator's
// output. Fails if a spec (or the preamble) changed without re-running
// `yarn generate:xsd`, or if the schema was hand-edited. Regenerate to fix.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateXsd } from "../../../scripts/generate-xsd";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const XSD = resolve(REPO, "src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd");

describe("XSD generation", () => {
  it("the committed schema is up to date with the specs (run `yarn generate:xsd`)", async () => {
    expect(await generateXsd()).toBe(readFileSync(XSD, "utf8"));
  });
});
