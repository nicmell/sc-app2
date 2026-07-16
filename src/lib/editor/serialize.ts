/** Deterministic XML serialization for editor documents. */

import type { EditorDoc, EditorNode, ElementNode } from "./model";

export const XML_PROLOG = '<?xml version="1.0" encoding="UTF-8"?>';
export const ROOT_ATTRS = 'xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"';

const escapeAttr = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const escapeText = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function serializeNode(node: EditorNode, depth: number): string {
  if (node.kind === "text") return escapeText(node.text);
  return serializeElement(node, depth);
}

function serializeElement(node: ElementNode, depth: number): string {
  const attrs = Object.entries(node.attrs).map(
    ([name, value]) => ` ${name}="${escapeAttr(value)}"`,
  );
  if (depth === 0) attrs.unshift(` ${ROOT_ATTRS}`);
  const open = `<${node.tag}${attrs.join("")}`;
  if (node.children.length === 0) return `${open}/>`;
  const mixed = node.children.some((child) => child.kind === "text");
  if (mixed)
    return `${open}>${node.children.map((child) => serializeNode(child, depth + 1)).join("")}</${node.tag}>`;
  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  return `${open}>\n${node.children.map((child) => childIndent + serializeNode(child, depth + 1)).join("\n")}\n${indent}</${node.tag}>`;
}

export function serializeEntry(doc: EditorDoc): string {
  return `${XML_PROLOG}\n${serializeElement(doc, 0)}\n`;
}
