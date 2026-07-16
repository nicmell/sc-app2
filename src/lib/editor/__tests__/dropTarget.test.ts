import { describe, expect, it } from "vitest";
import { computeDrop, type DropCandidate } from "../dropTarget";

const parent: DropCandidate = {
  key: "parent",
  tag: "sc-plugin",
  rect: { top: 0, bottom: 200, left: 0, right: 100 },
  index: 0,
  childCount: 1,
};
const child: DropCandidate = {
  key: "child",
  tag: "div",
  rect: { top: 50, bottom: 150, left: 0, right: 100 },
  parent,
  index: 0,
  childCount: 0,
};
const legal = (parentTag: string, childTag: string) =>
  parentTag === "sc-plugin" || (parentTag === "div" && childTag === "span");

describe("computeDrop", () => {
  it("uses the middle band for inside", () => {
    expect(computeDrop({ x: 10, y: 100 }, child, "span", legal)).toMatchObject({
      parentKey: "child",
      position: "inside",
    });
  });

  it("uses edge bands for before and after in a legal parent", () => {
    expect(computeDrop({ x: 10, y: 55 }, child, "span", legal)).toMatchObject({
      position: "before",
      index: 0,
    });
    expect(computeDrop({ x: 10, y: 145 }, child, "span", legal)).toMatchObject({
      position: "after",
      index: 1,
    });
  });

  it("walks ancestors and returns null if no placement is legal", () => {
    expect(computeDrop({ x: 10, y: 100 }, child, "other", legal)?.parentKey).toBe("parent");
    expect(computeDrop({ x: 10, y: 100 }, child, "other", () => false)).toBeNull();
  });
});
