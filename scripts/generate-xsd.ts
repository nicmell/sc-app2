// Generates src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd from the
// per-component *.spec.ts files. Run: `yarn generate:xsd`. The schema is
// single-sourced on the specs + the hand-authored preamble; the xsd-generate
// snapshot test fails if the committed schema drifts from the specs (at runtime
// the components read the same specs through getProp/the engine validate).
//
// Pure Node (fs + dynamic import) — no Lit/DOM — so it runs under tsx and inside
// vitest alike. Paths resolve from the repo root (this file lives in scripts/).

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ELEMENTS } from "../src/constants/sc-elements";
import { BLOCK_CONTENT, BLOCK_GROUPS, GROUP_NAMES } from "../src/sc-elements/internal/xsd/groups";
import {
  BIND_NS,
  COMMON_ATTRS,
  type AttrSpec,
  type ElementSpec,
} from "../src/sc-elements/internal/xsd/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_ROOT = resolve(ROOT, "src/sc-elements");
const PREAMBLE = resolve(ROOT, "src/sc-elements/internal/xsd/preamble.xml");
const OUT = resolve(ROOT, "src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd");

// XML Schema's equivalent of /^[A-Za-z_]\w*(?:-[A-Za-z_]\w*)*$/.
const NAME_PATTERN = "[A-Za-z_][A-Za-z0-9_]*(-[A-Za-z_][A-Za-z0-9_]*)*";

/** `sc-radio-group` → `scRadioGroupType`. */
function typeName(tag: string): string {
  const parts = tag.replace(/^sc-/, "").split("-");
  return "sc" + parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("") + "Type";
}

function xmlAttributeValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Load every `<tag>.spec.ts` under src/sc-elements, keyed by tag. */
export async function loadSpecs(): Promise<Map<string, ElementSpec>> {
  const files = readdirSync(SPEC_ROOT, { recursive: true }) as string[];
  const specs = new Map<string, ElementSpec>();
  for (const rel of files.filter((f) => f.endsWith(".spec.ts")).sort()) {
    const mod = (await import(pathToFileURL(resolve(SPEC_ROOT, rel)).href)) as {
      spec: ElementSpec;
    };
    if (specs.has(mod.spec.tag)) throw new Error(`duplicate spec for ${mod.spec.tag}`);
    specs.set(mod.spec.tag, mod.spec);
  }
  return specs;
}

/** The authored sc-* tags, in ELEMENTS order. */
export function authoredTags(): string[] {
  return Object.values(ELEMENTS);
}

function assertBijection(specs: Map<string, ElementSpec>): void {
  const tags = new Set(authoredTags());
  for (const tag of tags) if (!specs.has(tag)) throw new Error(`missing spec for element "${tag}"`);
  for (const tag of specs.keys())
    if (!tags.has(tag)) throw new Error(`spec "${tag}" is not an ELEMENTS entry`);
}

function attribute(elementTag: string, name: string, a: AttrSpec): string[] {
  if (a.default !== undefined && a.required) {
    throw new Error(
      `element "${elementTag}" attribute "${name}" cannot declare a default because it is required`,
    );
  }
  // A runtime attr (the default) is satisfied by EITHER its static form or
  // its `bind:` sibling, which XSD 1.0 can't express — it emits optional;
  // the runtime gate owns required and the mutual exclusion (XSD 1.1
  // asserts are the future upgrade). Only opted-out attrs keep
  // use="required".
  const use = a.required && a.runtime === false ? ' use="required"' : "";
  const defaultValue =
    a.default === undefined ? "" : ` default="${xmlAttributeValue(String(a.default))}"`;
  if (a.type === "enum") {
    return [
      `    <xs:attribute name="${name}"${defaultValue}${use}>`,
      `      <xs:simpleType>`,
      `        <xs:restriction base="xs:string">`,
      ...a.values.map((v) => `          <xs:enumeration value="${v}"/>`),
      `        </xs:restriction>`,
      `      </xs:simpleType>`,
      `    </xs:attribute>`,
    ];
  }
  const base = a.type === "scalar" || a.type === "name" ? "string" : a.type;
  const facets = [
    a.type === "name" ? `          <xs:pattern value="${NAME_PATTERN}"/>` : undefined,
    a.min !== undefined ? `          <xs:minInclusive value="${a.min}"/>` : undefined,
    a.max !== undefined ? `          <xs:maxInclusive value="${a.max}"/>` : undefined,
    a.exclusiveMin !== undefined
      ? `          <xs:minExclusive value="${a.exclusiveMin}"/>`
      : undefined,
  ].filter((line): line is string => line !== undefined);
  if (facets.length) {
    return [
      `    <xs:attribute name="${name}"${defaultValue}${use}>`,
      `      <xs:simpleType>`,
      `        <xs:restriction base="xs:${base}">`,
      ...facets,
      `        </xs:restriction>`,
      `      </xs:simpleType>`,
      `    </xs:attribute>`,
    ];
  }
  return [`    <xs:attribute name="${name}" type="xs:${base}"${defaultValue}${use}/>`];
}

function complexType(spec: ElementSpec): string[] {
  const mixed = spec.content?.mixed ? ' mixed="true"' : "";
  const lines = [`  <xs:complexType name="${typeName(spec.tag)}"${mixed}>`];
  const choice = spec.content?.choice;
  if (choice?.length) {
    // fastxml 0.8.0 ignores minOccurs="0" on a bare choice (an empty element
    // fails "requires one of") — an optional SEQUENCE wrapper carries the
    // emptiness instead, with the same content semantics.
    lines.push(`    <xs:sequence minOccurs="0">`);
    lines.push(`      <xs:choice maxOccurs="unbounded">`);
    for (const ref of choice) {
      lines.push(
        GROUP_NAMES.has(ref)
          ? `        <xs:group ref="${ref}"/>`
          : `        <xs:element ref="${ref}"/>`,
      );
    }
    lines.push(`      </xs:choice>`);
    lines.push(`    </xs:sequence>`);
  }
  const attrs = Object.entries(spec.attrs ?? {});
  for (const [name, a] of attrs) {
    if (!COMMON_ATTRS.has(name)) lines.push(...attribute(spec.tag, name, a));
  }
  lines.push(`    <xs:attributeGroup ref="commonAttrs"/>`);
  // Any runtime attr admits its whole `bind:` namespace here (fastxml doesn't
  // validate attributes; libxml2/CI enforces the namespace boundary) — WHICH
  // bind:* names are legal is the runtime the engine validate' job.
  if (attrs.some(([, a]) => a.runtime !== false)) {
    lines.push(`    <xs:anyAttribute namespace="${BIND_NS}" processContents="skip"/>`);
  }
  lines.push(`  </xs:complexType>`);
  return lines;
}

function group(name: string, refs: string[], kind: "element" | "group"): string[] {
  return [
    `  <xs:group name="${name}">`,
    `    <xs:choice>`,
    ...refs.map((r) => `      <xs:${kind} ref="${r}"/>`),
    `    </xs:choice>`,
    `  </xs:group>`,
  ];
}

export async function generateXsd(): Promise<string> {
  const specs = await loadSpecs();
  assertBijection(specs);
  const tags = authoredTags();
  const ordered = tags.map((t) => specs.get(t)!);

  const elements = tags.map((t) => `  <xs:element name="${t}" type="${typeName(t)}"/>`);

  const groups: string[] = [];
  for (const { category, group: gname } of BLOCK_GROUPS) {
    const members = ordered.filter((s) => s.category === category).map((s) => s.tag);
    groups.push(...group(gname, members, "element"), "");
  }
  groups.push(
    ...group(BLOCK_CONTENT, ["htmlElements", ...BLOCK_GROUPS.map((g) => g.group)], "group"),
  );

  const complexTypes = ordered.flatMap((s, i) =>
    i === 0 ? complexType(s) : ["", ...complexType(s)],
  );

  const preamble = readFileSync(PREAMBLE, "utf8");
  return preamble
    .replace(/[ \t]*<!-- @generated:elements -->/, elements.join("\n"))
    .replace(/[ \t]*<!-- @generated:groups -->/, groups.join("\n"))
    .replace(/[ \t]*<!-- @generated:complexTypes -->/, complexTypes.join("\n"));
}

// CLI: `tsx scripts/generate-xsd.ts` writes the schema.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const xsd = await generateXsd();
  writeFileSync(OUT, xsd);
  console.log(`wrote ${OUT}`);
}
