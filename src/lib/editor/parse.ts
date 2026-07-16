/** Parse namespace-well-formed plugin XML into the editor's immutable model. */

import { randomId } from "@/lib/utils/randomId";
import type { EditorDoc, EditorNode } from "./model";

export class EditorParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorParseError";
  }
}

function parseElement(element: Element): EditorDoc {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === "xmlns" || attr.name.startsWith("xmlns:")) continue;
    attrs[attr.name] = attr.value;
  }
  const domChildren = Array.from(element.childNodes);
  const keepText = domChildren.some(
    (child) => child.nodeType === Node.TEXT_NODE && (child.nodeValue ?? "").trim() !== "",
  );
  const children: EditorNode[] = [];
  for (const child of domChildren) {
    if (child.nodeType === Node.ELEMENT_NODE) children.push(parseElement(child as Element));
    else if (child.nodeType === Node.TEXT_NODE && keepText) {
      children.push({ key: randomId(), kind: "text", text: child.nodeValue ?? "" });
    }
  }
  return { key: randomId(), kind: "element", tag: element.localName, attrs, children };
}

export function parseEntry(xml: string): EditorDoc {
  const parsed = new DOMParser().parseFromString(xml, "text/xml");
  const parserError = parsed.getElementsByTagName("parsererror")[0];
  if (parserError) throw new EditorParseError(parserError.textContent?.trim() || "Invalid XML");
  const root = parsed.documentElement;
  if (!root || root.localName !== "sc-plugin") {
    throw new EditorParseError('Plugin entry root must be "sc-plugin"');
  }
  return parseElement(root);
}
