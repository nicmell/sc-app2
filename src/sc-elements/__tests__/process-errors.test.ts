import { beforeAll, describe, expect, it } from "vitest";
import { parsePlugin, wrapXml } from "@/lib/utils/test/test-utils";
import { registerScElements } from "@/sc-elements";

beforeAll(() => {
  registerScElements();
});

describe("process error prefixes", () => {
  it("wraps expression-library throws with the current element tag", () => {
    expect(() => parsePlugin(wrapXml(`<sc-var name="a" bind:value="pad(1)"/>`))).toThrow(
      /^<sc-var/,
    );
  });
});
