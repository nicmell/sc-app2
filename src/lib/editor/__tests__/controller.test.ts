import { describe, expect, it } from "vitest";
import { EditorController } from "../EditorController";
import { createElement, setAttr, updateNode, type ElementNode } from "../model";

function setRoot(controller: EditorController, value: string, coalesceKey?: string): void {
  controller.commit(
    (doc) => updateNode(doc, doc.key, (node) => setAttr(node as ElementNode, "title", value)),
    coalesceKey,
  );
}

describe("EditorController", () => {
  it("supports undo, redo, and branch-clears-redo", () => {
    const controller = new EditorController(createElement("sc-plugin"));
    setRoot(controller, "one");
    setRoot(controller, "two");
    controller.undo();
    expect(controller.store.get().doc.attrs.title).toBe("one");
    controller.redo();
    expect(controller.store.get().doc.attrs.title).toBe("two");
    controller.undo();
    setRoot(controller, "branch");
    expect(controller.store.get().canRedo).toBe(false);
  });

  it("coalesces continuous commits into one undo step", () => {
    const controller = new EditorController(createElement("sc-plugin"));
    setRoot(controller, "a", "title");
    setRoot(controller, "b", "title");
    controller.undo();
    expect(controller.store.get().doc.attrs.title).toBeUndefined();
    expect(controller.store.get().canUndo).toBe(false);
  });

  it("leaves state untouched when XML parsing fails", () => {
    const controller = new EditorController(createElement("sc-plugin"));
    const before = controller.store.get();
    expect(() => controller.applyXml("<broken>")).toThrow();
    expect(controller.store.get()).toBe(before);
  });

  it("keeps revision monotonic through commits and history", () => {
    const controller = new EditorController(createElement("sc-plugin"));
    setRoot(controller, "a");
    const first = controller.store.get().revision;
    controller.undo();
    const second = controller.store.get().revision;
    controller.redo();
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    expect(controller.store.get().revision).toBeGreaterThan(second);
  });
});
