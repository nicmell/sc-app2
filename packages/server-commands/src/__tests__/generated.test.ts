import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { render } from "../../scripts/generate-rust.ts";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");

describe("committed Rust command registry", () => {
  for (const [relative, expected] of render()) {
    it(`${relative} matches the generator`, () => {
      expect(readFileSync(path.join(repoRoot, relative), "utf8")).toBe(expected);
    });
  }
});
