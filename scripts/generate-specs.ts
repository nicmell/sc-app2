// Generates src-tauri/crates/sc-validate/specs.json from the per-component
// *.spec.ts files and the fixed HTML vocabulary in the XSD preamble. Run:
// `yarn generate:specs`. The artifact is the complete static contract consumed
// by the Rust validator; the frontend continues to read the same specs directly.
//
// Pure Node (fs + dynamic import through generate-xsd) — no Lit/DOM — so it runs
// under tsx and inside vitest alike. Paths resolve from the repo root (this file
// lives in scripts/).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { authoredTags, loadSpecs } from "./generate-xsd";
import { BLOCK_CONTENT, BLOCK_GROUPS, GROUP_NAMES } from "../src/sc-elements/internal/xsd/groups";
import {
  HTML_ELEMENTS,
  HTML_ELEMENTS_GROUP,
  INLINE_CONTENT,
  type HtmlContentKind,
} from "../src/sc-elements/internal/xsd/html";
import {
  COMMON_ATTRS,
  type AttrSpec,
  type ElementSpec,
} from "../src/sc-elements/internal/xsd/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src-tauri/crates/sc-validate/specs.json");

type JsonAttr = {
  name: string;
  type: AttrSpec["type"];
  required: boolean;
  runtime: boolean;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  exclusiveMin?: number;
  numeric?: boolean;
  values?: readonly string[];
};

type JsonContent = {
  mixed: boolean;
  children: string[];
};

type JsonElement = {
  tag: string;
  attrs: JsonAttr[];
  content: JsonContent | null;
};

/** Return specs in the authored ELEMENTS order, rejecting missing or extra specs. */
function orderedSpecs(specs: Map<string, ElementSpec>, tags: readonly string[]): ElementSpec[] {
  const authored = new Set(tags);
  const ordered: ElementSpec[] = [];
  for (const tag of tags) {
    const spec = specs.get(tag);
    if (spec === undefined) throw new Error(`missing spec for element "${tag}"`);
    ordered.push(spec);
  }
  for (const tag of specs.keys()) {
    if (!authored.has(tag)) throw new Error(`spec "${tag}" is not an ELEMENTS entry`);
  }
  return ordered;
}

function groupMembers(
  groups: ReadonlyMap<string, readonly string[]>,
  name: string,
): readonly string[] {
  const members = groups.get(name);
  if (members === undefined) throw new Error(`missing group "${name}"`);
  return members;
}

function buildGroups(ordered: readonly ElementSpec[]): Map<string, readonly string[]> {
  const groups = new Map<string, readonly string[]>([
    ["htmlElements", [...HTML_ELEMENTS_GROUP]],
    ["inlineContent", [...INLINE_CONTENT]],
  ]);
  for (const { category, group } of BLOCK_GROUPS) {
    groups.set(
      group,
      ordered.filter((spec) => spec.category === category).map((spec) => spec.tag),
    );
  }
  groups.set(BLOCK_CONTENT, [
    ...groupMembers(groups, "htmlElements"),
    ...BLOCK_GROUPS.flatMap(({ group }) => groupMembers(groups, group)),
  ]);
  for (const name of GROUP_NAMES) groupMembers(groups, name);
  return groups;
}

function flattenChoice(
  elementTag: string,
  choice: readonly string[],
  groups: ReadonlyMap<string, readonly string[]>,
): string[] {
  const flattened = choice.flatMap((ref) =>
    GROUP_NAMES.has(ref) ? [...groupMembers(groups, ref)] : [ref],
  );
  const seen = new Set<string>();
  for (const tag of flattened) {
    if (seen.has(tag)) {
      throw new Error(`duplicate content member "${tag}" in element "${elementTag}"`);
    }
    seen.add(tag);
  }
  return flattened;
}

function attributeEntry(name: string, attr: AttrSpec): JsonAttr {
  const entry: JsonAttr = {
    name,
    type: attr.type,
    required: attr.required ?? false,
    runtime: attr.runtime !== false,
  };
  if (attr.default !== undefined) entry.default = attr.default;
  if (attr.min !== undefined) entry.min = attr.min;
  if (attr.max !== undefined) entry.max = attr.max;
  if (attr.exclusiveMin !== undefined) entry.exclusiveMin = attr.exclusiveMin;
  if (attr.type === "vector") entry.numeric = attr.numeric ?? false;
  if (attr.type === "enum") entry.values = [...attr.values];
  return entry;
}

function htmlContent(kind: HtmlContentKind, blockContent: readonly string[]): JsonContent {
  switch (kind) {
    case "block":
      return { mixed: true, children: [...blockContent] };
    case "inline":
      return { mixed: true, children: [...INLINE_CONTENT] };
    case "list":
      return { mixed: false, children: ["li"] };
    case "empty":
      return { mixed: false, children: [] };
  }
}

function authoredElement(
  spec: ElementSpec,
  groups: ReadonlyMap<string, readonly string[]>,
): JsonElement {
  const choice = spec.content?.choice;
  return {
    tag: spec.tag,
    attrs: Object.entries(spec.attrs ?? {}).map(([name, attr]) => attributeEntry(name, attr)),
    content: choice?.length
      ? {
          mixed: !!spec.content?.mixed,
          children: flattenChoice(spec.tag, choice, groups),
        }
      : null,
  };
}

export async function generateSpecs(): Promise<string> {
  const specs = await loadSpecs();
  const tags = authoredTags();
  const ordered = orderedSpecs(specs, tags);
  const groups = buildGroups(ordered);
  const blockContent = groupMembers(groups, BLOCK_CONTENT);

  const htmlElements: JsonElement[] = HTML_ELEMENTS.map(({ tag, kind }) => ({
    tag,
    attrs: [],
    content: htmlContent(kind, blockContent),
  }));
  const authoredElements = ordered.map((spec) => authoredElement(spec, groups));

  const payload = {
    $comment: "GENERATED by scripts/generate-specs.ts — do not edit. Run `yarn generate:specs`.",
    version: 1,
    commonAttrs: [...COMMON_ATTRS],
    groups: Object.fromEntries(groups),
    elements: [...htmlElements, ...authoredElements],
  };
  return JSON.stringify(payload, null, 2) + "\n";
}

// CLI: `tsx scripts/generate-specs.ts` writes the Rust validator artifact.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const specs = await generateSpecs();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, specs);
  console.log(`wrote ${OUT}`);
}
