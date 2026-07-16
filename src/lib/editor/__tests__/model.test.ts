import { describe, expect, it } from "vitest";
import {
  createElement,
  findNode,
  insertChild,
  moveNode,
  setAttr,
  setBind,
  updateNode,
  type TextNode,
} from "../model";

const text = (key: string, value: string): TextNode => ({ key, kind: "text", text: value });

describe("editor model", () => {
  it("path-copies changed ancestors while preserving siblings and keys", () => {
    const left = createElement("div", {}, [text("text", "old")]);
    const right = createElement("span");
    const doc = createElement("sc-plugin", {}, [left, right]);
    const next = updateNode(doc, "text", (node) => ({ ...node, text: "new" }) as TextNode);
    expect(next).not.toBe(doc);
    expect(next.children[0]).not.toBe(left);
    expect(next.children[1]).toBe(right);
    expect(findNode(next, left.key)?.key).toBe(left.key);
  });

  it("inserts without disturbing existing children", () => {
    const child = createElement("div");
    const doc = createElement("sc-plugin", {}, [child]);
    const added = createElement("span");
    const next = insertChild(doc, doc.key, added, 0);
    expect(next.children).toEqual([added, child]);
    expect(next.children[1]).toBe(child);
  });

  it("guards descendant moves and adjusts same-parent indices", () => {
    const leaf = createElement("span");
    const branch = createElement("div", {}, [leaf]);
    const last = createElement("p");
    const doc = createElement("sc-plugin", {}, [branch, last]);
    expect(moveNode(doc, branch.key, leaf.key)).toBe(doc);
    const moved = moveNode(doc, branch.key, doc.key, 2);
    expect(moved.children.map((node) => node.key)).toEqual([last.key, branch.key]);
  });

  it("keeps static and bind forms mutually exclusive", () => {
    const node = createElement("sc-slider", { value: "1", "bind:value": "old" });
    const bound = setBind(node, "value", "vars.x");
    expect(bound.attrs).toEqual({ "bind:value": "vars.x" });
    const fixed = setAttr(bound, "value", "2");
    expect(fixed.attrs).toEqual({ value: "2" });
  });
});
