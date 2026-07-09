// Generates src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd from the
// per-component *.spec.ts files. Run: `yarn generate:xsd`. The schema is
// single-sourced on the specs + the hand-authored preamble; the xsd-generate
// snapshot test fails if the committed schema drifts from the specs (at runtime
// the components read the same specs through getProp/validateProps).
//
// Pure Node (fs + dynamic import) — no Lit/DOM — so it runs under tsx and inside
// vitest alike. Paths resolve from the repo root (this file lives in scripts/).

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ELEMENTS } from "../src/constants/sc-elements";
import { BLOCK_CONTENT, BLOCK_GROUPS, GROUP_NAMES } from "../src/sc-elements/internal/xsd/groups";
import type { AttrSpec, ElementSpec } from "../src/sc-elements/internal/xsd/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_ROOT = resolve(ROOT, "src/sc-elements");
const PREAMBLE = resolve(ROOT, "src/sc-elements/internal/xsd/preamble.xml");
const OUT = resolve(ROOT, "src-tauri/src/core/plugin/xsd/sc-plugin-schema.xsd");

/** `sc-radio-group` → `scRadioGroupType`. */
function typeName(tag: string): string {
  const parts = tag.replace(/^sc-/, "").split("-");
  return "sc" + parts.map((p) => p[0].toUpperCase() + p.slice(1)).join("") + "Type";
}

/** Load every `<tag>.spec.ts` under src/sc-elements, keyed by tag. */
export async function loadSpecs(): Promise<Map<string, ElementSpec>> {
  const files = readdirSync(SPEC_ROOT, { recursive: true }) as string[];
  const specs = new Map<string, ElementSpec>();
  for (const rel of files.filter((f) => f.endsWith(".spec.ts")).sort()) {
    const mod = (await import(pathToFileURL(resolve(SPEC_ROOT, rel)).href)) as { spec: ElementSpec };
    if (specs.has(mod.spec.tag)) throw new Error(`duplicate spec for ${mod.spec.tag}`);
    specs.set(mod.spec.tag, mod.spec);
  }
  return specs;
}

/** The authored sc-* tags, in ELEMENTS order (sc-plugin is host-only, no spec). */
export function authoredTags(): string[] {
  return Object.values(ELEMENTS).filter((t) => t !== "sc-plugin");
}

function assertBijection(specs: Map<string, ElementSpec>): void {
  const tags = new Set(authoredTags());
  for (const tag of tags) if (!specs.has(tag)) throw new Error(`missing spec for element "${tag}"`);
  for (const tag of specs.keys()) if (!tags.has(tag)) throw new Error(`spec "${tag}" is not an ELEMENTS entry`);
}

function attribute(name: string, a: AttrSpec): string[] {
  // A runtime attr is satisfied by EITHER form (`min` or `_min`), which XSD
  // 1.0 can't express — both emit optional; the runtime gate owns required
  // and the mutual exclusion (XSD 1.1 asserts are the future upgrade).
  const use = a.required && !a.runtime ? ' use="required"' : "";
  const lines =
    a.type === "enum"
      ? [
          `    <xs:attribute name="${name}"${use}>`,
          `      <xs:simpleType>`,
          `        <xs:restriction base="xs:string">`,
          ...a.values.map((v) => `          <xs:enumeration value="${v}"/>`),
          `        </xs:restriction>`,
          `      </xs:simpleType>`,
          `    </xs:attribute>`,
        ]
      : [`    <xs:attribute name="${name}" type="xs:${a.type === "scalar" ? "string" : a.type}"${use}/>`];
  if (a.runtime) {
    // The `_`-prefixed sibling: a bind expression, always an optional string.
    lines.push(`    <xs:attribute name="_${name}" type="xs:string"/>`);
  }
  return lines;
}

function complexType(spec: ElementSpec): string[] {
  const mixed = spec.content?.mixed ? ' mixed="true"' : "";
  const lines = [`  <xs:complexType name="${typeName(spec.tag)}"${mixed}>`];
  const choice = spec.content?.choice;
  if (choice?.length) {
    lines.push(`    <xs:choice minOccurs="0" maxOccurs="unbounded">`);
    for (const ref of choice) {
      lines.push(
        GROUP_NAMES.has(ref) ? `      <xs:group ref="${ref}"/>` : `      <xs:element ref="${ref}"/>`,
      );
    }
    lines.push(`    </xs:choice>`);
  }
  for (const [name, a] of Object.entries(spec.attrs ?? {})) lines.push(...attribute(name, a));
  lines.push(`    <xs:attributeGroup ref="commonAttrs"/>`);
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

  const complexTypes = ordered.flatMap((s, i) => (i === 0 ? complexType(s) : ["", ...complexType(s)]));

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
