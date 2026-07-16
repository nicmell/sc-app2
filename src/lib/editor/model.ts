/**
 * Immutable plain-data model used by the plugin editor. Every editing helper
 * path-copies only the ancestors it changes, preserving keys and sibling identity.
 */

import { randomId } from "@/lib/utils/randomId";

export type NodeKey = string;

export interface TextNode {
  key: NodeKey;
  kind: "text";
  text: string;
}

export interface ElementNode {
  key: NodeKey;
  kind: "element";
  tag: string;
  attrs: Readonly<Record<string, string>>;
  children: ReadonlyArray<EditorNode>;
}

export type EditorNode = ElementNode | TextNode;
export type EditorDoc = ElementNode;

export function findNode(root: EditorNode, key: NodeKey): EditorNode | null {
  if (root.key === key) return root;
  if (root.kind === "text") return null;
  for (const child of root.children) {
    const found = findNode(child, key);
    if (found) return found;
  }
  return null;
}

export function findPath(root: EditorNode, key: NodeKey): ReadonlyArray<number> | null {
  if (root.key === key) return [];
  if (root.kind === "text") return null;
  for (let index = 0; index < root.children.length; index += 1) {
    const path = findPath(root.children[index], key);
    if (path) return [index, ...path];
  }
  return null;
}

export function getParent(root: EditorNode, key: NodeKey): ElementNode | null {
  if (root.kind === "text") return null;
  if (root.children.some((child) => child.key === key)) return root;
  for (const child of root.children) {
    const parent = getParent(child, key);
    if (parent) return parent;
  }
  return null;
}

export function updateNode<T extends EditorNode = EditorNode>(
  root: T,
  key: NodeKey,
  update: (node: EditorNode) => EditorNode,
): T {
  if (root.key === key) return update(root) as T;
  if (root.kind === "text") return root;
  let changed = false;
  const children = root.children.map((child) => {
    const next = updateNode(child, key, update);
    changed ||= next !== child;
    return next;
  });
  return changed ? { ...root, children } : root;
}

export function insertChild(
  doc: EditorDoc,
  parentKey: NodeKey,
  child: EditorNode,
  index?: number,
): EditorDoc {
  return updateNode(doc, parentKey, (node) => {
    if (node.kind !== "element") return node;
    const at = Math.max(0, Math.min(index ?? node.children.length, node.children.length));
    return {
      ...node,
      children: [...node.children.slice(0, at), child, ...node.children.slice(at)],
    };
  });
}

export function removeNode(doc: EditorDoc, key: NodeKey): EditorDoc {
  if (doc.key === key) return doc;
  const parent = getParent(doc, key);
  if (!parent) return doc;
  return updateNode(doc, parent.key, (node) => {
    if (node.kind !== "element") return node;
    return { ...node, children: node.children.filter((child) => child.key !== key) };
  });
}

export function moveNode(
  doc: EditorDoc,
  key: NodeKey,
  newParentKey: NodeKey,
  index?: number,
): EditorDoc {
  const node = findNode(doc, key);
  const oldParent = getParent(doc, key);
  const newParent = findNode(doc, newParentKey);
  if (!node || !oldParent || newParent?.kind !== "element") return doc;
  if (key === newParentKey || findNode(node, newParentKey)) return doc;

  const oldIndex = oldParent.children.findIndex((child) => child.key === key);
  let at = Math.max(0, Math.min(index ?? newParent.children.length, newParent.children.length));
  if (oldParent.key === newParentKey && oldIndex < at) at -= 1;
  if (oldParent.key === newParentKey && oldIndex === at) return doc;
  return insertChild(removeNode(doc, key), newParentKey, node, at);
}

export function setAttr(node: ElementNode, name: string, value: string | null): ElementNode {
  const attrs = { ...node.attrs };
  if (value === null) delete attrs[name];
  else attrs[name] = value;
  delete attrs[`bind:${name}`];
  return { ...node, attrs };
}

export function setBind(node: ElementNode, name: string, value: string | null): ElementNode {
  const attrs = { ...node.attrs };
  const bindName = `bind:${name}`;
  if (value === null) delete attrs[bindName];
  else attrs[bindName] = value;
  delete attrs[name];
  return { ...node, attrs };
}

export function setText(node: TextNode, text: string): TextNode {
  return node.text === text ? node : { ...node, text };
}

export function createElement(
  tag: string,
  attrs: Readonly<Record<string, string>> = {},
  children: ReadonlyArray<EditorNode> = [],
): ElementNode {
  return { key: randomId(), kind: "element", tag, attrs: { ...attrs }, children: [...children] };
}
