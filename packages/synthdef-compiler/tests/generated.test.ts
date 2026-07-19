import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { render, strayFiles } from "../scripts/generate-rust.ts";

const root = resolve(import.meta.dirname, "../../..");

describe("committed Rust registries", () => {
  for (const [path, expected] of render()) {
    it(`${path} is current`, () => {
      expect(readFileSync(resolve(root, path), "utf8")).toBe(expected);
    });
  }
});

it("no stray committed files outside the spec", () => {
  expect(strayFiles()).toEqual([]);
});
